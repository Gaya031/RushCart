from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.schemas.wallet_schema import WalletOut
from app.api.deps.auth_deps import get_current_user
from app.models.user_model import User
from app.services.wallet_service import get_wallet_snapshot

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.get("/", response_model=WalletOut)
async def get_wallet(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await get_wallet_snapshot(db=db, user=user)
    
