from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from datetime import datetime, timezone
from app.models.product_model import Product
from app.models.seller_model import Seller
from app.models.subscription_model import Subscription
from app.core.config import settings
from app.core.exceptions import (PermissionDeniedException, NotFoundException, ConflictException)
from app.core.logging import logger
from app.services.search_service import upsert_product_document
from app.utils.simple_cache import cache_delete_prefix


async def get_approved_seller(db: AsyncSession, user_id: int) -> Seller:
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    seller = result.scalars().first()
    
    if not seller:
        raise NotFoundException("seller profile not found")
    
    if not seller.approved:
        raise PermissionDeniedException("seller not approved")

    await _enforce_subscription(db, seller)
    return seller


def _to_utc(value):
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def _enforce_subscription(db: AsyncSession, seller: Seller) -> None:
    if not seller.subscription_plan_id:
        if settings.ENFORCE_SELLER_SUBSCRIPTION:
            raise PermissionDeniedException("Active subscription required")
        return

    plan = await db.get(Subscription, seller.subscription_plan_id)
    if not plan or not plan.active:
        if settings.ENFORCE_SELLER_SUBSCRIPTION:
            raise PermissionDeniedException("Active subscription required")
        return

    expiry = _to_utc(seller.subscription_expiry)
    now = datetime.now(timezone.utc)
    if expiry and expiry < now and settings.ENFORCE_SELLER_SUBSCRIPTION:
        raise PermissionDeniedException("Seller subscription expired")

    if seller.commission_percent != plan.commission_percent:
        seller.commission_percent = plan.commission_percent
        await db.commit()


async def create_product(db: AsyncSession, user_id: int, data: dict) -> Product:
    seller = await get_approved_seller(db, user_id)
    product = Product(
        seller_id = seller.id,
        **data,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    try:
        await upsert_product_document(db, product.id)
    except Exception as exc:
        logger.warning("Product indexing failed for %s: %s", product.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return product


async def update_product(db: AsyncSession, product_id: int, user_id: int, data: dict) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise NotFoundException("product not found")
    
    seller = await get_approved_seller(db, user_id)
    
    if product.seller_id != seller.id:
        raise PermissionDeniedException("Not your product")
    
    for key, value in data.items():
        setattr(product, key, value)
        
    await db.commit()
    await db.refresh(product)
    try:
        await upsert_product_document(db, product.id)
    except Exception as exc:
        logger.warning("Product indexing failed for %s: %s", product.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return product


async def update_stock(db: AsyncSession, product_id: int, user_id: int, new_stock: int) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise NotFoundException("Product not found")
    
    seller = await get_approved_seller(db, user_id)
    
    if product.seller_id != seller.id:
        raise PermissionDeniedException("Not your product")
    
    product.stock = new_stock
    await db.commit()
    await db.refresh(product)
    try:
        await upsert_product_document(db, product.id)
    except Exception as exc:
        logger.warning("Product indexing failed for %s: %s", product.id, str(exc))
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return product


async def reduce_stock(db: AsyncSession, product_id: int, quantity: int):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise NotFoundException("Product not found")
    
    if product.stock < quantity:
        raise ConflictException("Insufficient stock")
    
    product.stock -= quantity
    await db.commit()
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")


async def delete_product(db: AsyncSession, product_id: int, user_id: int) -> bool:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise NotFoundException("Product not found")

    seller = await get_approved_seller(db, user_id)
    if product.seller_id != seller.id:
        raise PermissionDeniedException("Not your product")

    await db.delete(product)
    await db.commit()
    await cache_delete_prefix("search:")
    await cache_delete_prefix("stores:")
    return True

async def get_products(db: AsyncSession, skip: int = 0, limit: int = 50, only_active: bool = True):
    query = select(Product).offset(skip).limit(limit)
    if only_active:
        query = query.where(Product.is_active == True)
    result = await db.execute(query.order_by(Product.created_at.desc()))
    product = result.scalars().all()
    return product

    """Get featured products - returns products with stock > 0"""

async def get_featured_products(db: AsyncSession, limit: int = 10):
    result = await db.execute(
        select(Product).where(Product.stock > 0).limit(limit)
    )
    products = result.scalars().all()
    return products


async def get_my_products(db: AsyncSession, user_id: int) -> list[Product]:
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    seller_profile = result.scalars().first()
    if not seller_profile:
        return []
    rows = await db.execute(select(Product).where(Product.seller_id == seller_profile.id))
    return rows.scalars().all()


async def search_products_by_query(db: AsyncSession, q: str) -> list[Product]:
    result = await db.execute(
        select(Product).where(
            or_(Product.title.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%"))
        )
    )
    return result.scalars().all()


async def get_product_or_404(db: AsyncSession, product_id: int) -> Product:
    product = await db.get(Product, product_id)
    if not product:
        raise NotFoundException("Product not found")
    return product
