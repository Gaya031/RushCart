from datetime import datetime, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.delivery_model import Delivery, DeliveryStatus
from app.models.order_model import Order, OrderStatus
from app.models.notification_model import NotificationType
from app.models.seller_model import Seller
from app.models.user_model import User, UserRole
from app.core.exceptions import NotFoundException, ConflictException, PermissionDeniedException
from app.services.notification_service import create_notification
from app.utils.email_handler import send_email_background
from app.utils.email_templates import order_status_email
from app.utils.distance import calculate_distance_km

async def assign_delivery_partner(db: AsyncSession, order_id: int, partner_id: int, distance_km: int) -> Delivery:
    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("Order not found")
    
    if order.status != OrderStatus.packed:
        raise ConflictException("Order not ready for delivery")
    
    result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    if result.scalars().first():
        raise ConflictException("Delivery already assigned")
    
    delivery_fee = distance_km * 10  #example
    partner_earning = int(delivery_fee * 0.8)
    delivery = Delivery(
        order_id = order_id,
        partner_id = partner_id,
        distance_km = distance_km,
        delivery_fee = delivery_fee,
        partner_earning = partner_earning
    )
    order.delivery_partner_id = partner_id
    order.status = OrderStatus.shipped
    
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    return delivery


def _extract_drop_coordinates(address: dict | None) -> tuple[float | None, float | None]:
    if not isinstance(address, dict):
        return None, None
    coordinates = address.get("coordinates")
    if not isinstance(coordinates, dict):
        return None, None
    drop_lat = _coerce_float(coordinates.get("lat") or coordinates.get("latitude"))
    drop_lng = _coerce_float(coordinates.get("lng") or coordinates.get("longitude"))
    return drop_lat, drop_lng


def _estimate_distance_km(seller: Seller | None, address: dict | None) -> int:
    pickup_lat = _coerce_float(getattr(seller, "latitude", None))
    pickup_lng = _coerce_float(getattr(seller, "longitude", None))
    drop_lat, drop_lng = _extract_drop_coordinates(address)
    if pickup_lat is None or pickup_lng is None or drop_lat is None or drop_lng is None:
        return 5
    try:
        return max(1, int(round(calculate_distance_km(pickup_lat, pickup_lng, drop_lat, drop_lng))))
    except Exception:
        return 5


async def claim_delivery_for_partner(db: AsyncSession, order_id: int, partner_id: int) -> Delivery:
    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("Order not found")

    existing_result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    existing = existing_result.scalars().first()
    if existing:
        if existing.partner_id != partner_id:
            raise ConflictException("Delivery already claimed by another partner")
        return existing

    if order.status not in (OrderStatus.packed, OrderStatus.shipped):
        raise ConflictException("Order is not ready for delivery")

    if order.delivery_partner_id and order.delivery_partner_id != partner_id:
        raise ConflictException("Order already assigned to another delivery partner")

    seller = await db.get(Seller, order.seller_id)
    distance_km = _estimate_distance_km(seller, order.address or {})
    delivery_fee = distance_km * 10
    partner_earning = int(delivery_fee * 0.8)

    delivery = Delivery(
        order_id=order.id,
        partner_id=partner_id,
        distance_km=distance_km,
        delivery_fee=delivery_fee,
        partner_earning=partner_earning,
        status=DeliveryStatus.assigned,
    )
    order.delivery_partner_id = partner_id
    order.status = OrderStatus.shipped

    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    return delivery

async def update_delivery_status(db: AsyncSession, delivery_id: int, partner_id: int, status: DeliveryStatus) -> Delivery:
    delivery = await db.get(Delivery, delivery_id)
    if not delivery:
        raise NotFoundException("Delivery not found")
    
    if delivery.partner_id != partner_id:
        raise ConflictException("Not your delivery")
    
    order = await db.get(Order, delivery.order_id)
    if status == DeliveryStatus.delivered and order:
        order.status = OrderStatus.delivered
        
    delivery.status = status
    await db.commit()
    await db.refresh(delivery)
    if order:
        user = await db.get(User, order.buyer_id)
        if user:
            await create_notification(
                db=db,
                user_id=user.id,
                data={
                    "title": f"Delivery update for order #{order.id}",
                    "message": f"Order status is now {order.status.value if status == DeliveryStatus.delivered else status.value}.",
                    "type": NotificationType.delivery,
                    "link": f"/buyer/order/{order.id}/tracking",
                },
            )
            subject, body = order_status_email(
                user.name,
                order.id,
                order.status.value if status == DeliveryStatus.delivered else status.value,
            )
            send_email_background(user.email, subject, body)
    return delivery


async def get_partner_deliveries(
    db: AsyncSession, partner_id: int, status: DeliveryStatus | None = None
) -> list[Delivery]:
    query = select(Delivery).where(Delivery.partner_id == partner_id)
    if status:
        query = query.where(Delivery.status == status)
    result = await db.execute(query.order_by(Delivery.created_at.desc()))
    return result.scalars().all()


async def list_open_orders_for_delivery(db: AsyncSession, partner_id: int, limit: int = 50) -> list[dict]:
    assigned_result = await db.execute(select(Delivery.order_id))
    assigned_order_ids = {row[0] for row in assigned_result.all()}

    orders_result = await db.execute(
        select(Order)
        .where(
            Order.status.in_([OrderStatus.packed, OrderStatus.shipped]),
            Order.delivery_partner_id.is_(None),
        )
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = [o for o in orders_result.scalars().all() if o.id not in assigned_order_ids]

    payload = []
    for order in orders:
        seller = await db.get(Seller, order.seller_id)
        address = order.address or {}
        drop_lat, drop_lng = _extract_drop_coordinates(address if isinstance(address, dict) else {})
        pickup_lat = _coerce_float(getattr(seller, "latitude", None))
        pickup_lng = _coerce_float(getattr(seller, "longitude", None))
        distance_km = _estimate_distance_km(seller, address if isinstance(address, dict) else {})
        delivery_fee = distance_km * 10
        partner_earning = int(delivery_fee * 0.8)
        payload.append(
            {
                "id": None,
                "order_id": order.id,
                "partner_id": None,
                "status": "open",
                "distance_km": distance_km,
                "delivery_fee": delivery_fee,
                "partner_earning": partner_earning,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "claim_required": True,
                "pickup": {
                    "name": getattr(seller, "store_name", None) or "Pickup Store",
                    "address": getattr(seller, "address", None),
                    "lat": pickup_lat,
                    "lng": pickup_lng,
                },
                "drop": {
                    "name": address.get("name") if isinstance(address, dict) else "Customer",
                    "address": address.get("house_no") if isinstance(address, dict) else None,
                    "city": address.get("city") if isinstance(address, dict) else None,
                    "state": address.get("state") if isinstance(address, dict) else None,
                    "pincode": address.get("pincode") if isinstance(address, dict) else None,
                    "lat": drop_lat,
                    "lng": drop_lng,
                },
            }
        )
    return payload


async def get_partner_earnings_summary(db: AsyncSession, partner_id: int) -> dict:
    deliveries_result = await db.execute(
        select(func.count(Delivery.id)).where(
            Delivery.partner_id == partner_id, Delivery.status == DeliveryStatus.delivered
        )
    )
    earnings_result = await db.execute(
        select(func.coalesce(func.sum(Delivery.partner_earning), 0)).where(
            Delivery.partner_id == partner_id, Delivery.status == DeliveryStatus.delivered
        )
    )
    return {
        "completed_deliveries": deliveries_result.scalar() or 0,
        "total_earnings": int(earnings_result.scalar() or 0),
    }


def _coerce_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


async def get_delivery_route_context(db: AsyncSession, delivery_id: int, partner_id: int) -> dict:
    delivery = await db.get(Delivery, delivery_id)
    if not delivery:
        raise NotFoundException("Delivery not found")
    if delivery.partner_id != partner_id:
        raise PermissionDeniedException("Not your delivery")

    order = await db.get(Order, delivery.order_id)
    if not order:
        raise NotFoundException("Order not found")

    seller = await db.get(Seller, order.seller_id)

    address = order.address or {}
    coordinates = address.get("coordinates") if isinstance(address, dict) else None

    pickup_lat = _coerce_float(getattr(seller, "latitude", None))
    pickup_lng = _coerce_float(getattr(seller, "longitude", None))

    drop_lat = None
    drop_lng = None
    if isinstance(coordinates, dict):
        drop_lat = _coerce_float(coordinates.get("lat") or coordinates.get("latitude"))
        drop_lng = _coerce_float(coordinates.get("lng") or coordinates.get("longitude"))

    return {
        "delivery_id": delivery.id,
        "order_id": delivery.order_id,
        "status": delivery.status.value,
        "pickup": {
            "name": getattr(seller, "store_name", None) or "Pickup Store",
            "address": getattr(seller, "address", None),
            "lat": pickup_lat,
            "lng": pickup_lng,
        },
        "drop": {
            "name": address.get("name") if isinstance(address, dict) else "Customer",
            "address": address.get("house_no") if isinstance(address, dict) else None,
            "city": address.get("city") if isinstance(address, dict) else None,
            "state": address.get("state") if isinstance(address, dict) else None,
            "pincode": address.get("pincode") if isinstance(address, dict) else None,
            "lat": drop_lat,
            "lng": drop_lng,
        },
    }


async def generate_delivery_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> dict:
    # First try OSRM for real road route, then fall back to direct line.
    try:
        osrm_url = (
            "https://router.project-osrm.org/route/v1/driving/"
            f"{from_lng},{from_lat};{to_lng},{to_lat}?overview=full&geometries=geojson"
        )
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(osrm_url)
            response.raise_for_status()
            payload = response.json()
        route = (payload.get("routes") or [None])[0]
        if route and isinstance(route.get("geometry", {}).get("coordinates"), list):
            polyline = [[point[1], point[0]] for point in route["geometry"]["coordinates"]]
            return {
                "distance_km": float(route.get("distance", 0.0)) / 1000.0,
                "eta_minutes": max(1, int(round(float(route.get("duration", 0.0)) / 60.0))),
                "polyline": polyline,
                "source": "osrm",
            }
    except Exception:
        pass

    straight_distance = max(0.1, calculate_distance_km(from_lat, from_lng, to_lat, to_lng))
    return {
        "distance_km": float(straight_distance),
        "eta_minutes": max(1, int(round(straight_distance * 2))),
        "polyline": [[from_lat, from_lng], [to_lat, to_lng]],
        "source": "fallback",
    }


async def upsert_delivery_tracking(
    db: AsyncSession,
    delivery_id: int,
    partner_id: int,
    lat: float,
    lng: float,
    order_id: int | None = None,
    heading: float | None = None,
    speed: float | None = None,
    status: str | None = None,
) -> dict:
    delivery = await db.get(Delivery, delivery_id)
    if not delivery:
        raise NotFoundException("Delivery not found")
    if delivery.partner_id != partner_id:
        raise PermissionDeniedException("Not your delivery")
    if order_id is not None and delivery.order_id != order_id:
        raise ConflictException("Delivery and order mismatch")

    now_iso = datetime.now(timezone.utc).isoformat()
    tracking_row = {
        "lat": float(lat),
        "lng": float(lng),
        "heading": float(heading) if heading is not None else None,
        "speed": float(speed) if speed is not None else None,
        "status": status or delivery.status.value,
        "updated_at": now_iso,
    }

    history = delivery.location_history if isinstance(delivery.location_history, list) else []
    history.append(tracking_row)
    if len(history) > 300:
        history = history[-300:]
    delivery.location_history = history

    if status in {s.value for s in DeliveryStatus}:
        delivery.status = DeliveryStatus(status)

    await db.commit()
    await db.refresh(delivery)
    return {
        "delivery_id": delivery.id,
        "order_id": delivery.order_id,
        **tracking_row,
    }


async def get_order_tracking(db: AsyncSession, order_id: int) -> dict | None:
    result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    delivery = result.scalars().first()
    if not delivery:
        return None

    history = delivery.location_history if isinstance(delivery.location_history, list) else []
    if not history:
        return None

    latest = dict(history[-1])
    latest["delivery_id"] = delivery.id
    latest["order_id"] = delivery.order_id
    latest["status"] = latest.get("status") or delivery.status.value

    return {
        "tracking": latest,
        "history": history,
    }


def serialize_delivery(delivery: Delivery) -> dict:
    return {
        "id": delivery.id,
        "order_id": delivery.order_id,
        "partner_id": delivery.partner_id,
        "status": delivery.status.value,
        "distance_km": delivery.distance_km,
        "delivery_fee": delivery.delivery_fee,
        "partner_earning": delivery.partner_earning,
        "created_at": delivery.created_at.isoformat() if delivery.created_at else None,
    }


def attach_route_context(delivery_payload: dict, context: dict | None) -> dict:
    if not context:
        return delivery_payload
    payload = dict(delivery_payload)
    payload["pickup"] = context.get("pickup")
    payload["drop"] = context.get("drop")
    return payload


async def get_available_deliveries_feed(db: AsyncSession, partner_id: int) -> list[dict]:
    rows = await get_partner_deliveries(db=db, partner_id=partner_id)
    rows = [row for row in rows if row.status != DeliveryStatus.delivered]

    payload = []
    for row in rows:
        base = serialize_delivery(row)
        try:
            context = await get_delivery_route_context(db=db, delivery_id=row.id, partner_id=partner_id)
        except Exception:
            context = None
        payload.append(attach_route_context(base, context))

    open_orders = await list_open_orders_for_delivery(db=db, partner_id=partner_id)
    return payload + open_orders


async def get_assigned_deliveries_feed(
    db: AsyncSession,
    *,
    partner_id: int,
    include_delivered: bool = False,
) -> list[dict]:
    rows = await get_partner_deliveries(db=db, partner_id=partner_id)
    if not include_delivered:
        rows = [row for row in rows if row.status != DeliveryStatus.delivered]

    payload = []
    for row in rows:
        base = serialize_delivery(row)
        try:
            context = await get_delivery_route_context(db=db, delivery_id=row.id, partner_id=partner_id)
        except Exception:
            context = None
        payload.append(attach_route_context(base, context))
    return payload


async def claim_delivery_with_context(db: AsyncSession, *, order_id: int, partner_id: int) -> dict:
    row = await claim_delivery_for_partner(db=db, order_id=order_id, partner_id=partner_id)
    base = serialize_delivery(row)
    try:
        context = await get_delivery_route_context(db=db, delivery_id=row.id, partner_id=partner_id)
    except Exception:
        context = None
    return attach_route_context(base, context)


def parse_tracking_payload(payload: dict) -> dict:
    delivery_id = payload.get("delivery_id")
    lat = payload.get("lat")
    lng = payload.get("lng")
    if delivery_id is None or lat is None or lng is None:
        raise ConflictException("delivery_id, lat and lng are required")
    try:
        return {
            "delivery_id": int(delivery_id),
            "order_id": int(payload["order_id"]) if payload.get("order_id") is not None else None,
            "lat": float(lat),
            "lng": float(lng),
            "heading": float(payload["heading"]) if payload.get("heading") is not None else None,
            "speed": float(payload["speed"]) if payload.get("speed") is not None else None,
            "status": str(payload.get("status")) if payload.get("status") is not None else None,
        }
    except ValueError as exc:
        raise ConflictException("Invalid numeric payload values") from exc


async def get_tracking_for_order_access_checked(
    db: AsyncSession, *, order_id: int, current_user: User
) -> dict:
    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("Order not found")

    if current_user.role == UserRole.buyer and order.buyer_id != current_user.id:
        raise PermissionDeniedException("Not allowed to view this tracking")

    if current_user.role == UserRole.delivery:
        partner_delivery = await db.execute(
            select(Order.id).where(Order.id == order_id, Order.delivery_partner_id == current_user.id)
        )
        if partner_delivery.scalar() is None:
            raise PermissionDeniedException("Not allowed to view this tracking")

    if current_user.role == UserRole.seller:
        seller_id_result = await db.execute(select(Seller.id).where(Seller.user_id == current_user.id))
        seller_id = seller_id_result.scalar()
        if not seller_id or seller_id != order.seller_id:
            raise PermissionDeniedException("Not allowed to view this tracking")

    tracking = await get_order_tracking(db=db, order_id=order_id)
    if not tracking:
        raise NotFoundException("Tracking not found")
    return tracking
