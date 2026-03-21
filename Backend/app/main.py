import time
import warnings
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.api_v1 import api_router
from app.db.redis import init_redis, close_redis
from app.db.postgres import init_db
from app.core.exceptions import AppException
from app.core.logging import logger
from app.services.search_service import close_search_client, ensure_search_indices

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting RushCart backend...")
    await init_db()
    logger.info("Database schema initialized")
    try:
        await ensure_search_indices()
        logger.info("Elasticsearch indices ensured")
    except Exception as exc:
        logger.warning("Elasticsearch initialization skipped: %s", str(exc))
    await init_redis()
    logger.info("Redis connected")
    yield
    logger.info("Shutting down RushCart backend...")
    await close_redis()
    await close_search_client()
    logger.info("Redis connection closed")


def create_app() -> FastAPI:
    secret_length = len((settings.SECRET_KEY or "").encode("utf-8"))
    if secret_length < settings.JWT_MIN_SECRET_LENGTH:
        msg = (
            f"SECRET_KEY must be at least {settings.JWT_MIN_SECRET_LENGTH} bytes "
            f"for HS256. Current length={secret_length}."
        )
        if settings.DEBUG:
            warnings.warn(msg)
        else:
            raise RuntimeError(msg)

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )
    if settings.trusted_hosts:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    @app.middleware("http")
    async def security_and_request_logging(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid4())
        start = time.perf_counter()
        status_code = 500
        response = None
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception:
            logger.exception("Unhandled error request_id=%s path=%s", request_id, request.url.path)
            raise
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(
                "request_id=%s method=%s path=%s status=%s duration_ms=%s",
                request_id,
                request.method,
                request.url.path,
                status_code,
                duration_ms,
            )

        if response is None:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "Internal server error",
                    },
                },
            )

        csp = (
            "default-src 'self'; img-src 'self' data: https:; "
            "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' https: http:; frame-ancestors 'none';"
        )
        response.headers["x-request-id"] = request_id
        response.headers["x-content-type-options"] = "nosniff"
        response.headers["x-frame-options"] = "DENY"
        response.headers["x-xss-protection"] = "1; mode=block"
        response.headers["content-security-policy"] = csp
        response.headers["permissions-policy"] = "geolocation=(self), camera=(), microphone=()"
        response.headers["cross-origin-opener-policy"] = "same-origin"
        if request.url.path.startswith("/uploads/"):
            response.headers["cross-origin-resource-policy"] = "cross-origin"
        else:
            response.headers["cross-origin-resource-policy"] = "same-origin"
        response.headers["referrer-policy"] = "strict-origin-when-cross-origin"
        if settings.ENABLE_HSTS:
            response.headers["strict-transport-security"] = (
                f"max-age={settings.HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload"
            )
        response.headers["cache-control"] = response.headers.get("cache-control", "no-store")
        return response

    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": exc.detail,
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": exc.errors(),
                },
            },
        )

    return app


app = create_app()
