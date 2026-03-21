from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.models.seller_model import Seller
from app.models.subscription_model import Subscription
from app.schemas.subscription_schema import SubscriptionCreate


async def create_subscription(db: AsyncSession, data: SubscriptionCreate) -> Subscription:
    exists = await db.execute(select(Subscription).where(Subscription.plan_name == data.plan_name))
    if exists.scalars().first():
        raise ConflictException("Subscription already exists")
    sub = Subscription(**data.model_dump())
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def list_active_subscriptions(db: AsyncSession):
    result = await db.execute(select(Subscription).where(Subscription.active.is_(True)))
    return result.scalars().all()


async def activate_seller_subscription(db: AsyncSession, user_id: int, plan_id: int) -> Seller:
    seller_row = await db.execute(select(Seller).where(Seller.user_id == user_id))
    seller = seller_row.scalars().first()
    if not seller:
        raise NotFoundException("Seller profile not found")

    plan = await db.get(Subscription, plan_id)
    if not plan or not plan.active:
        raise NotFoundException("Subscription plan not found")

    now = datetime.utcnow()
    seller.subscription_plan_id = plan.id
    seller.subscription_expiry = now + timedelta(days=plan.duration_days)
    seller.commission_percent = plan.commission_percent
    await db.commit()
    await db.refresh(seller)
    return seller

