from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth_deps import require_roles
from app.db.postgres import get_db
from app.models.user_model import User
from app.schemas.admin_schema import ReturnDecision, SellerApproval, UserBlock
from app.services.admin_service import (
    block_user,
    decide_return,
    decide_seller,
    export_orders_report_csv,
    get_revenue_analytics,
    list_orders_with_items,
    list_pending_returns,
    list_refund_queue,
    list_sellers_with_users,
    list_users_overview,
    refund_order,
    update_seller_commission_config,
)
from app.utils.rate_limiter import RateLimiter

admin_rate_limit = RateLimiter(limit=50, window_seconds=60, key_prefix="admin")
router = APIRouter(
    prefix="/admin", dependencies=[Depends(admin_rate_limit)], tags=["admin"]
)


@router.patch("/users/{user_id}")
async def block_unblock_user(
    user_id: int,
    data: UserBlock,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await block_user(db=db, user_id=user_id, blocked=data.blocked)


@router.post("/sellers/{seller_id}/decision")
async def seller_decision(
    seller_id: int,
    data: SellerApproval,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await decide_seller(
        db=db,
        seller_id=seller_id,
        approved=data.approved,
        commission_percent=data.commission_percent,
    )


@router.post("/orders/{order_id}/return-decision")
async def return_decision(
    order_id: int,
    data: ReturnDecision,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await decide_return(db=db, order_id=order_id, approved=data.approved)


@router.post("/orders/{order_id}/refund")
async def refund(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await refund_order(db, order_id)


@router.get("/sellers")
async def list_sellers(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await list_sellers_with_users(db=db)


@router.get("/orders")
async def list_orders(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await list_orders_with_items(db=db)


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await list_users_overview(db=db)


@router.get("/returns")
async def pending_returns(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await list_pending_returns(db=db)


@router.get("/refunds")
async def refund_queue(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await list_refund_queue(db=db)


@router.patch("/commission/config")
async def update_commission_config(
    seller_id: int,
    commission_percent: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await update_seller_commission_config(
        db=db,
        seller_id=seller_id,
        commission_percent=commission_percent,
    )


@router.get("/analytics/revenue")
async def revenue_analytics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await get_revenue_analytics(db=db)


@router.get("/reports/export")
async def export_report(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await export_orders_report_csv(db=db)
