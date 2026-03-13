from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth_deps import require_roles
from app.db.postgres import get_db
from app.models.user_model import User
from app.schemas.banner_schema import BannerCreate, BannerOut, BannerUpdate
from app.services.banner_service import create_banner, delete_banner, list_active_banners, list_all_banners, update_banner
from app.services.upload_service import upload_public_file

router = APIRouter(prefix="/banners", tags=["banners"])


@router.get("/", response_model=list[BannerOut])
async def get_banners(db: AsyncSession = Depends(get_db)):
    return await list_active_banners(db)


@router.get("/admin", response_model=list[BannerOut])
async def get_all_banners_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await list_all_banners(db)


@router.post("/", response_model=BannerOut, status_code=status.HTTP_201_CREATED)
async def create_banner_route(
    data: BannerCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    return await create_banner(db, data.model_dump())


@router.put("/{banner_id}", response_model=BannerOut)
async def update_banner_route(
    banner_id: int,
    data: BannerUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    banner = await update_banner(db, banner_id, data.model_dump(exclude_none=True))
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return banner


@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner_route(
    banner_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    deleted = await delete_banner(db, banner_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Banner not found")


@router.post("/upload-image")
async def upload_banner_image(
    request: Request,
    file: UploadFile = File(...),
    admin: User = Depends(require_roles("admin")),
):
    return await upload_public_file(request=request, file=file, sub_dir="banners")
