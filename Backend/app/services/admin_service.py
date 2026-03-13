from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from fastapi import Response
from app.models.user_model import User
from app.models.seller_model import Seller, SellerKYCStatus
from app.models.commission_model import Commission
from app.models.order_model import Order, OrderStatus, ReturnStatus
from app.models.notification_model import NotificationType
from app.services.refund_service import process_refund
from app.services.order_service import get_order_items_map
from app.core.exceptions import(NotFoundException, ConflictException)
from app.core.logging import logger
from app.services.notification_service import create_notification
from app.services.search_service import upsert_store_document
from app.utils.simple_cache import cache_delete_prefix
from app.utils.email_handler import send_email_background
from app.utils.email_templates import order_status_email, seller_approval_email


async def block_user(db: AsyncSession, user_id: int, blocked: bool) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundException("User not found")
    
    user.is_blocked = blocked
    await db.commit()
    return user

async def decide_seller(db: AsyncSession, seller_id: int, approved: bool, commission_percent: int | None) -> Seller:
    seller = await db.get(Seller, seller_id)
    if not seller:
        raise NotFoundException("Seller not found")
    
    if approved:
        if commission_percent is None:
            raise ConflictException("Commission percent required")
        seller.approved = True
        seller.kyc_status = SellerKYCStatus.approved
        seller.commission_percent = commission_percent
    else:
        seller.approved = False
        seller.kyc_status = SellerKYCStatus.rejected
        
    await db.commit()
    await db.refresh(seller)
    user = await db.get(User, seller.user_id)
    if user:
        await create_notification(
            db=db,
            user_id=user.id,
            data={
                "title": "Seller verification update",
                "message": f"Your seller profile has been {'approved' if approved else 'rejected'}.",
                "type": NotificationType.system,
                "link": "/seller/approval-status",
            },
        )
        subject, body = seller_approval_email(user.name, approved)
        send_email_background(user.email, subject, body)
    try:
        await upsert_store_document(db, seller.id)
    except Exception as exc:
        logger.warning("Seller indexing failed for %s: %s", seller.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller

async def decide_return(db: AsyncSession, order_id: int, approved: bool) -> Order:
    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("Order not found")
    
    if order.return_status != ReturnStatus.requested:
        raise ConflictException("No pending return requested")
    if approved:
        order.return_status = ReturnStatus.approved
    else:
        order.return_status = ReturnStatus.rejected
        
    await db.commit()
    user = await db.get(User, order.buyer_id)
    if user:
        await create_notification(
            db=db,
            user_id=user.id,
            data={
                "title": f"Return {'approved' if approved else 'rejected'}",
                "message": f"Your return request for order #{order.id} has been {'approved' if approved else 'rejected'}.",
                "type": NotificationType.order,
                "link": f"/buyer/order/{order.id}",
            },
        )
        subject, body = order_status_email(user.name, order.id, f"return_{order.return_status.value}")
        send_email_background(user.email, subject, body)
    return order


async def refund_order(db: AsyncSession, order_id: int) -> dict:
    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("Order not found")
    return await process_refund(db, order_id)


async def list_sellers_with_users(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Seller).order_by(Seller.created_at.desc()))
    sellers = result.scalars().all()

    user_ids = [s.user_id for s in sellers]
    user_map = {}
    if user_ids:
        user_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        user_map = {user.id: user for user in user_result.scalars().all()}

    payload = []
    for seller in sellers:
        user = user_map.get(seller.user_id)
        payload.append(
            {
                "id": seller.id,
                "store_name": seller.store_name,
                "commission_percent": seller.commission_percent,
                "is_approved": seller.approved,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "is_blocked": user.is_blocked,
                }
                if user
                else None,
            }
        )
    return payload


async def list_orders_with_items(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    orders = result.scalars().all()
    items_map = await get_order_items_map(db, [order.id for order in orders])

    payload = []
    for order in orders:
        items = items_map.get(order.id, [])
        payload.append(
            {
                "id": order.id,
                "status": order.status.value,
                "total_amount": float(order.total_amount),
                "items": [
                    {
                        "product_id": i.product_id,
                        "quantity": i.quantity,
                        "price": float(i.price),
                    }
                    for i in items
                ],
                "created_at": order.created_at.isoformat() if order.created_at else None,
            }
        )
    return payload


async def list_users_overview(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "wallet_balance": u.wallet_balance,
            "is_blocked": u.is_blocked,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


async def list_pending_returns(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Order)
        .where(Order.return_status == ReturnStatus.requested)
        .order_by(Order.created_at.desc())
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "status": r.status.value,
            "return_status": r.return_status.value,
            "total_amount": float(r.total_amount),
        }
        for r in rows
    ]


async def list_refund_queue(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Order).where(Order.return_status.in_([ReturnStatus.approved, ReturnStatus.picked]))
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "status": r.status.value,
            "return_status": r.return_status.value,
            "total_amount": float(r.total_amount),
        }
        for r in rows
    ]


async def update_seller_commission_config(
    db: AsyncSession, seller_id: int, commission_percent: int
) -> dict:
    seller = await db.get(Seller, seller_id)
    if not seller:
        return {"updated": False, "reason": "seller not found"}

    seller.commission_percent = commission_percent
    await db.commit()
    return {"updated": True, "seller_id": seller_id, "commission_percent": commission_percent}


async def get_revenue_analytics(db: AsyncSession) -> dict:
    metrics = await db.execute(
        select(
            select(func.count(Seller.id)).scalar_subquery().label("total_sellers"),
            select(func.count(User.id))
            .where(User.is_blocked.is_(False))
            .scalar_subquery()
            .label("active_users"),
            select(func.count(Order.id)).scalar_subquery().label("total_orders"),
            select(func.count(Order.id))
            .where(Order.status == OrderStatus.delivered)
            .scalar_subquery()
            .label("delivered_orders"),
            select(func.coalesce(func.sum(Order.total_amount), 0))
            .where(Order.status != OrderStatus.cancelled)
            .scalar_subquery()
            .label("gross_revenue"),
            select(func.coalesce(func.sum(Commission.commission_amount), 0))
            .scalar_subquery()
            .label("platform_commission"),
        )
    )
    row = metrics.one()
    return {
        "total_sellers": int(row.total_sellers or 0),
        "active_users": int(row.active_users or 0),
        "total_orders": int(row.total_orders or 0),
        "delivered_orders": int(row.delivered_orders or 0),
        "gross_revenue": int(row.gross_revenue or 0),
        "total_revenue": int(row.gross_revenue or 0),
        "platform_commission": int(row.platform_commission or 0),
    }


async def export_orders_report_csv(db: AsyncSession) -> Response:
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    orders = result.scalars().all()
    lines = ["id,status,total_amount,created_at"]
    for order in orders:
        lines.append(
            f"{order.id},{order.status.value},{order.total_amount},"
            f"{order.created_at.isoformat() if order.created_at else ''}"
        )
    csv_data = "\n".join(lines)
    return Response(content=csv_data, media_type="text/csv")
