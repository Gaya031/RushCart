from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.wallet_model import WalletTransaction
from app.models.user_model import User
from app.core.exceptions import ConflictException

async def credit_wallet(db: AsyncSession, user_id: int, amount: int, txn_type: str, reference_id: str | None = None):
    if amount <= 0:
        raise ConflictException("Invalid credit amount")
    user = await db.get(User, user_id)
    user.wallet_balance += amount
    txn = WalletTransaction(
        user_id=user_id,
        amount=amount,
        type=txn_type,
        reference_id=reference_id
    )
    db.add(txn)
    await db.commit()
    
    
async def debit_wallet(db: AsyncSession, user_id: int, amount: int, txn_type: str, reference_id: str | None = None):
    user = await db.get(User, user_id)
    if user.wallet_balance < amount:
        raise ConflictException("Insufficient wallet balance")
    user.wallet_balance -= amount
    txn = WalletTransaction(
        user_id=user_id,
        amount=amount,
        type=txn_type,
        reference_id=reference_id
    )
    db.add(txn)
    await db.commit()


async def get_wallet_snapshot(db: AsyncSession, user: User) -> dict:
    txns = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == user.id)
        .order_by(WalletTransaction.created_at.desc())
    )
    return {
        "balance": user.wallet_balance,
        "transactions": txns.scalars().all(),
    }
