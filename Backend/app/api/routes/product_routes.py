from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth_deps import require_roles
from app.db.postgres import get_db
from app.models.user_model import User
from app.schemas.product_schema import ProductCreate, ProductOut, ProductUpdate, StockUpdate
from app.services.product_service import (
    create_product,
    get_my_products,
    get_product_or_404,
    delete_product,
    get_featured_products,
    get_products,
    search_products_by_query,
    update_product,
    update_stock,
)
from app.services.upload_service import upload_public_file

router = APIRouter(tags=["products"])


@router.post("/upload-image")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...),
    _seller: User = Depends(require_roles("seller")),
):
    return await upload_public_file(request=request, file=file, sub_dir="products")


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(require_roles("seller")),
):
    return await create_product(db=db, user_id=seller.id, data=data.model_dump())


@router.put("/{product_id}", response_model=ProductOut)
async def update(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(require_roles("seller")),
):
    return await update_product(
        db=db,
        product_id=product_id,
        user_id=seller.id,
        data=data.model_dump(exclude_none=True),
    )


@router.patch("/{product_id}/stock", response_model=ProductOut)
async def update_product_stock(
    product_id: int,
    data: StockUpdate,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(require_roles("seller")),
):
    return await update_stock(db=db, product_id=product_id, user_id=seller.id, new_stock=data.stock)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(require_roles("seller")),
):
    await delete_product(db=db, product_id=product_id, user_id=seller.id)


@router.get("/", response_model=list[ProductOut], status_code=status.HTTP_200_OK)
async def products(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    include_inactive: bool = Query(False),
    category: str | None = Query(None, description="Filter by category slug or name"),
    db: AsyncSession = Depends(get_db),
):
    skip = (page - 1) * size
    return await get_products(
        db=db,
        skip=skip,
        limit=size,
        only_active=not include_inactive,
        category=category,
    )


@router.get("/mine", response_model=list[ProductOut])
async def my_products(
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(require_roles("seller")),
):
    return await get_my_products(db=db, user_id=seller.id)


@router.get("/featured", response_model=list[ProductOut])
async def featured_products(db: AsyncSession = Depends(get_db)):
    return await get_featured_products(db=db)


@router.get("/search", response_model=list[ProductOut])
async def search_products(
    q: str = Query(..., min_length=1, max_length=120),
    db: AsyncSession = Depends(get_db),
):
    return await search_products_by_query(db=db, q=q)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    return await get_product_or_404(db=db, product_id=product_id)
