from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import case, func, select

from app.models.commission_model import Commission
from app.models.notification_model import NotificationType
from app.models.order_item_model import OrderItem
from app.models.order_model import Order, OrderStatus
from app.models.seller_model import Seller
from app.models.user_model import User
from app.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from app.core.logging import logger
from app.services.notification_service import create_notification
from app.services.order_service import get_order_items_map
from app.services.search_service import upsert_store_document
from app.utils.email_handler import send_email_background
from app.utils.email_templates import order_status_email
from app.utils.simple_cache import cache_delete_prefix


def _normalize_location_fields(data: dict | None) -> dict:
    if not data:
        return {}
    normalized = dict(data)
    for key in ("latitude", "longitude"):
        if key in normalized and normalized[key] is not None:
            try:
                normalized[key] = float(normalized[key])
            except (TypeError, ValueError):
                normalized[key] = None
    return normalized


async def create_seller_profile(
    db: AsyncSession, user_id: int, store_name: str, data: dict | None = None
) -> Seller:
    existing = await db.execute(select(Seller).where(Seller.user_id == user_id))
    if existing.scalars().first():
        raise ConflictException("Seller profile already exists")
    
    seller = Seller(
        user_id=user_id,
        store_name=store_name,
        approved=False,
        **_normalize_location_fields(data),
    )
    
    db.add(seller)
    await db.commit()
    await db.refresh(seller)
    try:
        await upsert_store_document(db, seller.id)
    except Exception as exc:
        logger.warning("Seller indexing failed for %s: %s", seller.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller


async def get_seller_by_user_id(db: AsyncSession, user_id: int) -> Seller | None:
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    return result.scalars().first()


async def update_seller_profile(db: AsyncSession, user_id: int, data: dict) -> Seller:
    seller = await get_seller_by_user_id(db, user_id)
    if not seller:
        raise NotFoundException("Seller not found")

    normalized_data = _normalize_location_fields(data)
    for key, value in normalized_data.items():
        setattr(seller, key, value)

    await db.commit()
    await db.refresh(seller)
    try:
        await upsert_store_document(db, seller.id)
    except Exception as exc:
        logger.warning("Seller indexing failed for %s: %s", seller.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller


async def upload_kyc_for_user(db: AsyncSession, user_id: int, kyc_data: dict) -> Seller:
    seller = await get_seller_by_user_id(db, user_id)
    if not seller:
        raise NotFoundException("Seller not found")

    seller.kyc_docs = kyc_data
    await db.commit()
    await db.refresh(seller)
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller


async def upload_kyc_document_for_user(
    db: AsyncSession, user_id: int, doc_type: str, doc_url: str
) -> Seller:
    seller = await get_seller_by_user_id(db, user_id)
    if not seller:
        raise NotFoundException("Seller not found")

    docs = seller.kyc_docs if isinstance(seller.kyc_docs, dict) else {}
    docs = dict(docs)
    docs[doc_type] = doc_url
    seller.kyc_docs = docs

    await db.commit()
    await db.refresh(seller)
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller

async def upload_kyc(db: AsyncSession, seller_id: int, kyc_data: dict, user_id: int) -> Seller:
    result = await db.execute(select(Seller).where(Seller.id == seller_id))
    seller = result.scalars().first()
    
    if not seller:
        raise NotFoundException("Seller not found")
    
    if seller.user_id != user_id:
        raise PermissionDeniedException("Not your seller profile")
    
    seller.kyc_docs = kyc_data
    await db.commit()
    await db.refresh(seller)
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller

async def approve_seller(db: AsyncSession, seller_id: int, commission_percent: int) -> Seller:
    result = await db.execute(select(Seller).where(Seller.id == seller_id))
    seller = result.scalars().first()
    
    if not seller:
        raise NotFoundException("seller not found")
    
    seller.approved = True
    seller.commission_percent = commission_percent
    await db.commit()
    await db.refresh(seller)
    try:
        await upsert_store_document(db, seller.id)
    except Exception as exc:
        logger.warning("Seller indexing failed for %s: %s", seller.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return seller


async def get_seller_for_user_or_404(db: AsyncSession, user_id: int) -> Seller:
    seller = await get_seller_by_user_id(db, user_id)
    if not seller:
        raise NotFoundException("Seller profile not found")
    return seller


async def get_seller_approval_status(db: AsyncSession, user_id: int) -> dict:
    seller = await get_seller_for_user_or_404(db, user_id)
    return {"approved": seller.approved, "kyc_status": seller.kyc_status}


async def get_seller_orders(db: AsyncSession, user_id: int) -> list[dict]:
    seller = await get_seller_for_user_or_404(db, user_id)
    result = await db.execute(
        select(Order).where(Order.seller_id == seller.id).order_by(Order.created_at.desc())
    )
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
                    {"product_id": i.product_id, "quantity": i.quantity, "price": float(i.price)}
                    for i in items
                ],
                "created_at": order.created_at.isoformat() if order.created_at else None,
            }
        )
    return payload


async def get_seller_earnings_summary(db: AsyncSession, user_id: int) -> dict:
    seller = await get_seller_for_user_or_404(db, user_id)
    delivered_stats = await db.execute(
        select(
            func.count(Order.id).label("completed_orders"),
            func.coalesce(func.sum(Order.total_amount), 0).label("gross_revenue"),
        ).where(Order.seller_id == seller.id, Order.status == OrderStatus.delivered)
    )
    row = delivered_stats.one()
    return {
        "completed_orders": int(row.completed_orders or 0),
        "gross_revenue": int(row.gross_revenue or 0),
    }


async def get_seller_commission_details(db: AsyncSession, user_id: int) -> dict:
    seller = await get_seller_for_user_or_404(db, user_id)
    rows = await db.execute(
        select(Commission).where(Commission.seller_id == seller.id).order_by(Commission.created_at.desc())
    )
    commissions = rows.scalars().all()
    total_platform = sum(int(c.commission_amount) for c in commissions)
    total_earning = sum(int(c.seller_earning) for c in commissions)
    return {
        "current_commission_percent": seller.commission_percent,
        "total_platform_commission": total_platform,
        "total_seller_earnings": total_earning,
        "rows": commissions,
    }


async def get_seller_dashboard_stats(db: AsyncSession, user_id: int) -> dict:
    seller = await get_seller_for_user_or_404(db, user_id)

    orders_stats = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(case((Order.status == OrderStatus.delivered, 1), else_=0)).label(
                "delivered_orders"
            ),
            func.sum(
                case((Order.status.in_([OrderStatus.placed, OrderStatus.packed]), 1), else_=0)
            ).label("pending_orders"),
            func.coalesce(
                func.sum(case((Order.status == OrderStatus.delivered, Order.total_amount), else_=0)),
                0,
            ).label("total_revenue"),
        ).where(Order.seller_id == seller.id)
    )
    row = orders_stats.one()

    product_stats = await db.execute(
        select(func.count())
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.seller_id == seller.id)
    )
    total_items_sold = int(product_stats.scalar() or 0)

    latest_orders = await db.execute(
        select(Order).where(Order.seller_id == seller.id).order_by(Order.created_at.desc()).limit(5)
    )
    latest = latest_orders.scalars().all()
    latest_items_map = await get_order_items_map(db, [o.id for o in latest])

    return {
        "total_orders": int(row.total_orders or 0),
        "delivered_orders": int(row.delivered_orders or 0),
        "pending_orders": int(row.pending_orders or 0),
        "total_revenue": int(row.total_revenue or 0),
        "total_items_sold": total_items_sold,
        "latest_orders": [
            {
                "id": o.id,
                "status": o.status.value,
                "total_amount": float(o.total_amount),
                "items_count": len(latest_items_map.get(o.id, [])),
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in latest
        ],
    }


async def update_seller_order_status(
    db: AsyncSession,
    *,
    user_id: int,
    order_id: int,
    status: OrderStatus,
) -> dict:
    seller = await get_seller_for_user_or_404(db, user_id)
    order = await db.get(Order, order_id)
    if not order or order.seller_id != seller.id:
        raise NotFoundException("Order not found")

    if order.status in (OrderStatus.cancelled, OrderStatus.delivered):
        raise ConflictException("Finalized orders cannot be updated")

    allowed_statuses = {OrderStatus.packed, OrderStatus.shipped}
    if status not in allowed_statuses:
        raise ConflictException("Seller can update only to packed/shipped")

    order.status = status
    await db.commit()
    await db.refresh(order)

    buyer = await db.get(User, order.buyer_id)
    if buyer:
        await create_notification(
            db=db,
            user_id=buyer.id,
            data={
                "title": f"Order #{order.id} updated",
                "message": f"Your order is now {order.status.value}.",
                "type": NotificationType.order,
                "link": f"/buyer/order/{order.id}/tracking",
            },
        )
        subject, body = order_status_email(buyer.name, order.id, order.status.value)
        send_email_background(buyer.email, subject, body)

    return {"id": order.id, "status": order.status.value}


async def get_seller_subscription_status(db: AsyncSession, user_id: int) -> dict:
    seller = await get_seller_for_user_or_404(db, user_id)
    return {
        "subscription_plan_id": seller.subscription_plan_id,
        "subscription_expiry": seller.subscription_expiry.isoformat() if seller.subscription_expiry else None,
        "approved": seller.approved,
    }
