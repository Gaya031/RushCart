from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.services.system_service import (
    get_alerts_payload,
    get_liveness_payload,
    get_metrics_payload,
    get_prometheus_metrics_payload,
    get_readiness_payload,
)

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health/live")
async def liveness() -> dict:
    return get_liveness_payload()


@router.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db)) -> dict:
    return await get_readiness_payload(db=db)


@router.get("/metrics")
async def metrics() -> dict:
    return get_metrics_payload()


@router.get("/metrics/prometheus", response_class=PlainTextResponse)
async def metrics_prometheus() -> str:
    return get_prometheus_metrics_payload()


@router.get("/alerts")
async def alerts() -> dict:
    return get_alerts_payload()
