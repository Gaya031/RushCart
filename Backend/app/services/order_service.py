import logging
from decimal import Decimal
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from app.models.notification_model import NotificationType
from app.models.order_item_model import OrderItem
from app.models.order_model import Order, OrderStatus, PaymentMethod, ReturnStatus
from app.models.payment_model import Payment, PaymentStatus
from app.models.product_model import Product
from app.models.user_model import User
from app.services.notification_service import create_notification
from app.services.payment_service import initiate_refund
from app.utils.email_handler import send_email_background
from app.utils.email_templates import order_created_email, order_status_email
from app.utils.simple_cache import cache_get, cache_set
from app.utils.simple_cache import cache_delete_prefix

logger = logging.getLogger(__name__)


async def create_order(db: AsyncSession, buyer_id: int, payload) -> Order:
    total = Decimal("0.00")
    order_items: list[OrderItem] = []
    product_ids = [item.product_id for item in payload.items]
    if not product_ids:
        raise ConflictException("Order must include at least one item")

    products_result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {product.id: product for product in products_result.scalars().all()}

    for item in payload.items:
        product = products.get(item.product_id)

        if not product or not product.is_active:
            raise ConflictException("Invalid product")
        if product.seller_id != payload.seller_id:
            raise ConflictException("All items must belong to the selected seller")
        if product.stock < item.quantity:
            raise ConflictException(f"Insufficient stock for product {product.id}")

        product.stock -= item.quantity
        total += Decimal(product.price) * item.quantity
        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                price=product.price,
            )
        )

    buyer = await db.get(User, buyer_id)
    address_payload = payload.address.model_dump()
    name_value = str(address_payload.get("name") or "").strip()
    if not name_value or name_value.lower() in {"customer", "buyer", "user"}:
        if buyer and buyer.name:
            address_payload["name"] = buyer.name
    phone_value = str(address_payload.get("phone") or "").strip()
    if (not phone_value or phone_value == "9999999999") and buyer and buyer.phone:
        address_payload["phone"] = buyer.phone

    order = Order(
        buyer_id=buyer_id,
        seller_id=payload.seller_id,
        total_amount=int(total),
        payment_method=payload.payment_method,
        address=address_payload,
    )

    db.add(order)
    await db.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    await db.commit()
    await db.refresh(order)
    await cache_delete_prefix(f"orders:buyer:{buyer_id}:")
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return order


async def list_buyer_orders(db: AsyncSession, buyer_id: int, offset: int = 0, limit: int = 50) -> list[Order]:
    result = await db.execute(
        select(Order).where(Order.buyer_id == buyer_id).order_by(Order.created_at.desc()).offset(offset).limit(limit)
    )
    return result.scalars().all()


async def get_order_for_user(db: AsyncSession, order_id: int, user_id: int) -> Order:
    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.buyer_id != user_id:
        raise PermissionDeniedException("Not your order")
    return order


def can_cancel_order(status: OrderStatus) -> bool:
    return status in {OrderStatus.placed, OrderStatus.packed}


async def _restore_order_stock(db: AsyncSession, order_id: int) -> None:
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = items_result.scalars().all()
    if not items:
        return

    product_ids = list({item.product_id for item in items})
    products_result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in products_result.scalars().all()}

    for item in items:
        product = products.get(item.product_id)
        if product:
            product.stock = int(product.stock or 0) + int(item.quantity or 0)


async def cancel_order(db: AsyncSession, order_id: int, user_id: int) -> tuple[Order, str]:
    order = await get_order_for_user(db, order_id, user_id)
    if order.status == OrderStatus.cancelled:
        raise ConflictException("Order already cancelled")
    if not can_cancel_order(order.status):
        raise ConflictException("Only placed or packed orders can be cancelled")

    await _restore_order_stock(db, order.id)

    refund_status = "not_applicable"
    if order.payment_method == PaymentMethod.prepaid:
        refund_status = "not_required"
        payment_result = await db.execute(select(Payment).where(Payment.order_id == order.id))
        payment = payment_result.scalars().first()
        if payment and payment.status == PaymentStatus.completed:
            try:
                order.status = OrderStatus.cancelled
                await initiate_refund(db, order.id)
                refund_status = "initiated"
            except Exception as exc:
                logger.warning("Refund initiation failed for order %s: %s", order.id, str(exc))
                refund_status = "failed"
        elif payment and payment.status == PaymentStatus.initiated:
            payment.status = PaymentStatus.failed

    order.status = OrderStatus.cancelled
    await db.commit()
    await db.refresh(order)
    await cache_delete_prefix(f"orders:buyer:{user_id}:")
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return order, refund_status


async def get_buyer_order_summary(db: AsyncSession, buyer_id: int) -> dict:
    summary_q = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(case((Order.status.in_([OrderStatus.placed, OrderStatus.packed, OrderStatus.shipped]), 1), else_=0)).label("active_orders"),
            func.sum(case((Order.status == OrderStatus.delivered, 1), else_=0)).label("delivered_orders"),
            func.sum(case((Order.status == OrderStatus.cancelled, 1), else_=0)).label("cancelled_orders"),
        ).where(Order.buyer_id == buyer_id)
    )
    row = summary_q.one()

    recent_q = await db.execute(
        select(Order)
        .where(Order.buyer_id == buyer_id)
        .order_by(Order.created_at.desc())
        .limit(3)
    )
    recent_orders = recent_q.scalars().all()

    return {
        "total_orders": int(row.total_orders or 0),
        "active_orders": int(row.active_orders or 0),
        "delivered_orders": int(row.delivered_orders or 0),
        "cancelled_orders": int(row.cancelled_orders or 0),
        "recent_orders": [
            {
                "id": o.id,
                "status": o.status.value,
                "total_amount": float(o.total_amount),
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
    }


async def request_return(db: AsyncSession, order_id: int, user_id: int, reason: str, image: str | None) -> Order:
    order = await get_order_for_user(db, order_id, user_id)
    if order.status != OrderStatus.delivered:
        raise ConflictException("Only delivered orders can be returned")
    if order.return_status != ReturnStatus.none:
        raise ConflictException("Return already requested")

    order.return_status = ReturnStatus.requested
    order.return_reason = reason
    order.return_image = image
    await db.commit()
    await db.refresh(order)
    await cache_delete_prefix(f"orders:buyer:{user_id}:")
    return order


async def get_order_items_map(db: AsyncSession, order_ids: list[int]) -> dict[int, list[OrderItem]]:
    if not order_ids:
        return {}

    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id.in_(order_ids)).order_by(OrderItem.order_id.asc(), OrderItem.id.asc())
    )
    items = result.scalars().all()
    items_map: dict[int, list[OrderItem]] = {}
    for item in items:
        items_map.setdefault(item.order_id, []).append(item)
    return items_map


def serialize_order_payload(order: Order, items: list[OrderItem]) -> dict:
    return {
        "id": order.id,
        "status": order.status.value,
        "can_cancel": can_cancel_order(order.status),
        "total_amount": float(order.total_amount),
        "payment_method": order.payment_method.value,
        "address": order.address,
        "return_status": order.return_status.value if order.return_status else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": float(item.price),
            }
            for item in items
        ],
    }


async def place_order_and_notify(db: AsyncSession, user: User, payload) -> dict:
    order = await create_order(db=db, buyer_id=user.id, payload=payload)
    await cache_delete_prefix(f"orders:buyer:{user.id}:")
    await create_notification(
        db=db,
        user_id=user.id,
        data={
            "title": f"Order #{order.id} placed",
            "message": "Your order has been placed successfully.",
            "type": NotificationType.order,
            "link": f"/buyer/order/{order.id}/tracking",
        },
    )
    subject, body = order_created_email(user.name, order.id, int(order.total_amount))
    send_email_background(user.email, subject, body)
    return {
        "order_id": order.id,
        "status": order.status.value,
        "total_amount": float(order.total_amount),
    }


async def get_buyer_orders_payload(
    db: AsyncSession,
    *,
    user_id: int,
    page: int,
    size: int,
    include_items: bool,
) -> list[dict]:
    cache_key = f"orders:buyer:{user_id}:list:p{page}:s{size}:items{int(include_items)}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    offset = (page - 1) * size
    orders = await list_buyer_orders(db, user_id, offset=offset, limit=size)
    items_map = {}
    if include_items:
        items_map = await get_order_items_map(db, [order.id for order in orders])
    payload = [serialize_order_payload(order, items_map.get(order.id, [])) for order in orders]
    await cache_set(cache_key, payload, ttl_seconds=20)
    return payload


async def get_buyer_order_summary_payload(db: AsyncSession, user_id: int) -> dict:
    cache_key = f"orders:buyer:{user_id}:summary"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    payload = await get_buyer_order_summary(db, user_id)
    await cache_set(cache_key, payload, ttl_seconds=20)
    return payload


async def get_buyer_order_detail_payload(db: AsyncSession, *, order_id: int, user_id: int) -> dict:
    cache_key = f"orders:buyer:{user_id}:detail:{order_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    order = await get_order_for_user(db, order_id, user_id)
    items_map = await get_order_items_map(db, [order.id])
    payload = serialize_order_payload(order, items_map.get(order.id, []))
    await cache_set(cache_key, payload, ttl_seconds=20)
    return payload


async def cancel_order_and_notify(db: AsyncSession, *, order_id: int, user: User) -> dict:
    order, refund_status = await cancel_order(db, order_id, user.id)
    await cache_delete_prefix(f"orders:buyer:{user.id}:")
    await create_notification(
        db=db,
        user_id=user.id,
        data={
            "title": f"Order #{order.id} cancelled",
            "message": "Your order has been cancelled.",
            "type": NotificationType.order,
            "link": "/buyer/orders",
        },
    )
    subject, body = order_status_email(user.name, order.id, order.status.value)
    send_email_background(user.email, subject, body)
    return {"id": order.id, "status": order.status.value, "refund_status": refund_status}


async def request_return_and_notify(
    db: AsyncSession,
    *,
    order_id: int,
    user: User,
    reason: str,
    image: str | None,
) -> dict:
    order = await request_return(db, order_id, user.id, reason, image)
    await cache_delete_prefix(f"orders:buyer:{user.id}:")
    await create_notification(
        db=db,
        user_id=user.id,
        data={
            "title": f"Return requested for order #{order.id}",
            "message": "Your return request was submitted successfully.",
            "type": NotificationType.order,
            "link": f"/buyer/order/{order.id}",
        },
    )
    return {"id": order.id, "return_status": order.return_status.value}
