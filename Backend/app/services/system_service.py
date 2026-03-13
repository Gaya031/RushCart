from __future__ import annotations

from datetime import datetime, timezone

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.observability import request_metrics
from app.db.redis import get_redis


def get_liveness_payload() -> dict:
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def get_readiness_payload(db: AsyncSession) -> dict:
    checks = {
        "database": False,
        "redis": False,
        "elasticsearch": False,
    }

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    try:
        redis = await get_redis()
        checks["redis"] = bool(await redis.ping())
    except Exception:
        checks["redis"] = False

    try:
        timeout = httpx.Timeout(2.5)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(settings.ELASTICSEARCH_URL.rstrip("/"))
        checks["elasticsearch"] = response.status_code < 500
    except Exception:
        checks["elasticsearch"] = False

    overall = "ready" if checks["database"] and checks["redis"] else "degraded"
    return {
        "status": overall,
        "service": settings.APP_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }


def get_metrics_payload() -> dict:
    return request_metrics.snapshot()


def get_prometheus_metrics_payload() -> str:
    return request_metrics.prometheus_text()


def get_alerts_payload() -> dict:
    snap = request_metrics.snapshot()
    alerts_list: list[dict] = []

    if snap["error_rate"] >= settings.ALERT_ERROR_RATE_THRESHOLD:
        alerts_list.append(
            {
                "severity": "high",
                "code": "HIGH_ERROR_RATE",
                "message": (
                    f"Error rate {snap['error_rate']:.2%} is above threshold "
                    f"{settings.ALERT_ERROR_RATE_THRESHOLD:.2%}"
                ),
            }
        )

    if snap["p95_duration_ms"] >= settings.ALERT_P95_MS_THRESHOLD:
        alerts_list.append(
            {
                "severity": "medium",
                "code": "HIGH_P95_LATENCY",
                "message": (
                    f"p95 latency {snap['p95_duration_ms']}ms is above threshold "
                    f"{settings.ALERT_P95_MS_THRESHOLD}ms"
                ),
            }
        )

    if snap["inflight_requests"] >= settings.ALERT_INFLIGHT_THRESHOLD:
        alerts_list.append(
            {
                "severity": "medium",
                "code": "HIGH_INFLIGHT_REQUESTS",
                "message": (
                    f"Inflight requests {snap['inflight_requests']} is above threshold "
                    f"{settings.ALERT_INFLIGHT_THRESHOLD}"
                ),
            }
        )

    return {
        "status": "alerting" if alerts_list else "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "thresholds": {
            "error_rate": settings.ALERT_ERROR_RATE_THRESHOLD,
            "p95_duration_ms": settings.ALERT_P95_MS_THRESHOLD,
            "inflight_requests": settings.ALERT_INFLIGHT_THRESHOLD,
        },
        "alerts": alerts_list,
    }

