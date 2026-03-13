from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictException, NotFoundException, PermissionDeniedException
from app.db.postgres import get_db
from app.schemas.delivery_schema import (DeliveryAssign, DeliveryStatusUpdate)
from app.services.delivery_service import (
    assign_delivery_partner,
    claim_delivery_with_context,
    get_assigned_deliveries_feed,
    get_available_deliveries_feed,
    get_delivery_route_context,
    get_partner_earnings_summary,
    get_tracking_for_order_access_checked,
    generate_delivery_route,
    parse_tracking_payload,
    serialize_delivery,
    update_delivery_status,
    upsert_delivery_tracking,
)
from app.api.deps.auth_deps import get_current_user, require_roles
from app.models.user_model import User
from app.models.delivery_model import DeliveryStatus

router = APIRouter(prefix="/delivery", tags=["delivery"])

@router.post("/assign", status_code=status.HTTP_201_CREATED)
async def assign(data: DeliveryAssign, db: AsyncSession = Depends(get_db), admin: User = Depends(require_roles("admin"))):
    delivery = await assign_delivery_partner(
        db=db,
        order_id=data.order_id,
        partner_id=data.partner_id,
        distance_km=data.distance_km
    )
    return serialize_delivery(delivery)
    
@router.patch("/{delivery_id}/status")
async def update_status(delivery_id: int, data: DeliveryStatusUpdate, db: AsyncSession = Depends(get_db), partner: User = Depends(require_roles("delivery"))):
    delivery = await update_delivery_status(db=db, delivery_id=delivery_id, partner_id=partner.id, status=data.status)
    return serialize_delivery(delivery)


@router.get("/available")
async def available_deliveries(
    db: AsyncSession = Depends(get_db), partner: User = Depends(require_roles("delivery"))
):
    return await get_available_deliveries_feed(db=db, partner_id=partner.id)


@router.post("/claim/{order_id}")
async def claim_delivery(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    partner: User = Depends(require_roles("delivery")),
):
    return await claim_delivery_with_context(db=db, order_id=order_id, partner_id=partner.id)


@router.get("/assigned")
async def assigned_deliveries(
    include_delivered: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    partner: User = Depends(require_roles("delivery")),
):
    return await get_assigned_deliveries_feed(
        db=db,
        partner_id=partner.id,
        include_delivered=include_delivered,
    )


@router.post("/{delivery_id}/pickup-confirmation")
async def pickup_confirmation(
    delivery_id: int,
    db: AsyncSession = Depends(get_db),
    partner: User = Depends(require_roles("delivery")),
):
    row = await update_delivery_status(
        db=db, delivery_id=delivery_id, partner_id=partner.id, status=DeliveryStatus.picked
    )
    return serialize_delivery(row)


@router.post("/{delivery_id}/delivery-confirmation")
async def delivery_confirmation(
    delivery_id: int,
    db: AsyncSession = Depends(get_db),
    partner: User = Depends(require_roles("delivery")),
):
    row = await update_delivery_status(
        db=db, delivery_id=delivery_id, partner_id=partner.id, status=DeliveryStatus.delivered
    )
    return serialize_delivery(row)


@router.get("/earnings-summary")
async def earnings_summary(
    db: AsyncSession = Depends(get_db), partner: User = Depends(require_roles("delivery"))
):
    return await get_partner_earnings_summary(db=db, partner_id=partner.id)


@router.get("/{delivery_id}/route-context")
async def route_context(
    delivery_id: int,
    db: AsyncSession = Depends(get_db),
    partner: User = Depends(require_roles("delivery")),
):
    return await get_delivery_route_context(db=db, delivery_id=delivery_id, partner_id=partner.id)


@router.get("/map/route")
async def route_map(
    from_lat: float = Query(...),
    from_lng: float = Query(...),
    to_lat: float = Query(...),
    to_lng: float = Query(...),
    _: User = Depends(require_roles("delivery", "admin")),
):
    return await generate_delivery_route(from_lat=from_lat, from_lng=from_lng, to_lat=to_lat, to_lng=to_lng)


@router.post("/tracking/location")
async def tracking_location(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    partner: User = Depends(require_roles("delivery")),
):
    try:
        parsed = parse_tracking_payload(payload)
        tracking = await upsert_delivery_tracking(
            db=db,
            delivery_id=parsed["delivery_id"],
            partner_id=partner.id,
            order_id=parsed["order_id"],
            lat=parsed["lat"],
            lng=parsed["lng"],
            heading=parsed["heading"],
            speed=parsed["speed"],
            status=parsed["status"],
        )
    except ConflictException as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "tracking": tracking}


@router.get("/tracking/order/{order_id}")
async def tracking_by_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await get_tracking_for_order_access_checked(
            db=db,
            order_id=order_id,
            current_user=current_user,
        )
    except NotFoundException as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionDeniedException as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

