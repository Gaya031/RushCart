from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth_deps import require_roles
from app.core.exceptions import ConflictException, NotFoundException
from app.db.postgres import get_db
from app.models.order_model import OrderStatus
from app.models.user_model import User
from app.schemas.seller_schema import SellerCreate, SellerKYCUpdate, SellerOut, SellerUpdate
from app.services.seller_service import (
    approve_seller,
    create_seller_profile,
    get_seller_approval_status,
    get_seller_commission_details,
    get_seller_dashboard_stats,
    get_seller_earnings_summary,
    get_seller_for_user_or_404,
    get_seller_orders,
    get_seller_subscription_status,
    upload_kyc_document_for_user,
    update_seller_order_status,
    update_seller_profile,
    upload_kyc,
    upload_kyc_for_user,
)
from app.services.upload_service import upload_public_file

router = APIRouter(tags=["sellers"])


@router.post("/", response_model=SellerOut, status_code=status.HTTP_201_CREATED)
async def create_seller(
    data: SellerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await create_seller_profile(
        db=db,
        user_id=current_user.id,
        store_name=data.store_name,
        data=data.model_dump(exclude={"store_name"}, exclude_none=True),
    )


@router.post("/upload-image")
async def upload_seller_image(
    request: Request,
    file: UploadFile = File(...),
    image_type: Literal["logo", "cover"] = Query(default="logo"),
    current_user: User = Depends(require_roles("seller")),
):
    sub_dir = "sellers/logos" if image_type == "logo" else "sellers/covers"
    payload = await upload_public_file(request=request, file=file, sub_dir=sub_dir)
    payload["image_type"] = image_type
    return payload


@router.put("/{seller_id}/kyc", response_model=SellerOut)
async def update_kyc(
    seller_id: int,
    data: SellerKYCUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await upload_kyc(
        db=db,
        seller_id=seller_id,
        kyc_data=data.model_dump(exclude_none=True),
        user_id=current_user.id,
    )


@router.post("/{seller_id}/approve", response_model=SellerOut)
async def approve(
    seller_id: int,
    commission_percent: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await approve_seller(
        db=db,
        seller_id=seller_id,
        commission_percent=commission_percent,
    )


@router.get("/me", response_model=SellerOut)
async def get_my_seller_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_for_user_or_404(db=db, user_id=current_user.id)


@router.put("/me", response_model=SellerOut)
async def update_my_seller_profile(
    data: SellerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    payload = data.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No profile fields provided")
    return await update_seller_profile(db=db, user_id=current_user.id, data=payload)


@router.put("/me/kyc", response_model=SellerOut)
async def update_my_kyc(
    data: SellerKYCUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await upload_kyc_for_user(db=db, user_id=current_user.id, kyc_data=data.model_dump(exclude_none=True))


@router.post("/me/kyc/upload-document")
async def upload_my_kyc_document(
    request: Request,
    file: UploadFile = File(...),
    doc_type: Literal["aadhar", "pan", "gst", "business_proof"] = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    upload_payload = await upload_public_file(
        request=request,
        file=file,
        sub_dir=f"sellers/kyc/{doc_type}",
        allow_documents=True,
    )
    seller = await upload_kyc_document_for_user(
        db=db,
        user_id=current_user.id,
        doc_type=doc_type,
        doc_url=upload_payload["url"],
    )
    return {"doc_type": doc_type, "url": upload_payload["url"], "kyc_docs": seller.kyc_docs}


@router.get("/me/approval-status")
async def approval_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_approval_status(db=db, user_id=current_user.id)


@router.get("/me/orders")
async def my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_orders(db=db, user_id=current_user.id)


@router.get("/me/earnings-summary")
async def earnings_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_earnings_summary(db=db, user_id=current_user.id)


@router.get("/me/commission-details")
async def commission_details(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_commission_details(db=db, user_id=current_user.id)


@router.get("/me/dashboard-stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_dashboard_stats(db=db, user_id=current_user.id)


@router.patch("/me/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: OrderStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    try:
        return await update_seller_order_status(
            db=db,
            user_id=current_user.id,
            order_id=order_id,
            status=status,
        )
    except NotFoundException as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictException as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/me/subscription-status")
async def subscription_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("seller")),
):
    return await get_seller_subscription_status(db=db, user_id=current_user.id)
