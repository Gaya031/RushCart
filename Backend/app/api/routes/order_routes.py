from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth_deps import get_current_user
from app.db.postgres import get_db
from app.models.user_model import User
from app.schemas.order_schema import OrderCreate, OrderOut, ReturnRequest
from app.services.order_service import (
    cancel_order_and_notify,
    get_buyer_order_detail_payload,
    get_buyer_order_summary_payload,
    get_buyer_orders_payload,
    place_order_and_notify,
    request_return_and_notify,
)
from app.utils.rate_limiter import RateLimiter

router = APIRouter(prefix="/orders", tags=["orders"])
place_order_rate_limit = RateLimiter(limit=10, window_seconds=60, key_prefix="place_order")


@router.post("/", response_model=OrderOut)
async def place_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _rate_limit: None = Depends(place_order_rate_limit),
):
    return await place_order_and_notify(db=db, user=user, payload=payload)


@router.get("/")
async def list_orders(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    include_items: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_buyer_orders_payload(
        db=db,
        user_id=user.id,
        page=page,
        size=size,
        include_items=include_items,
    )


@router.get("/summary")
async def order_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_buyer_order_summary_payload(db=db, user_id=user.id)


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_buyer_order_detail_payload(db=db, order_id=order_id, user_id=user.id)


@router.post("/{order_id}/cancel")
async def cancel_order_route(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await cancel_order_and_notify(db=db, order_id=order_id, user=user)


@router.post("/{order_id}/return")
async def return_order_route(
    order_id: int,
    data: ReturnRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await request_return_and_notify(
        db=db,
        order_id=order_id,
        user=user,
        reason=data.reason,
        image=data.image,
    )
