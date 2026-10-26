from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.transaction import Transaction
from app.schemas.business import TransactionCreate, TransactionResponse, FinanceSummaryResponse
from app.services.deps import get_current_business
from app.tools.finance_tools import record_transaction, get_financial_summary

router = APIRouter(prefix="/api/finance", tags=["finance"])


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction).where(Transaction.business_id == business.id).order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()


@router.post("/transactions", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    payload: TransactionCreate, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    txn = await record_transaction(
        db, business.id, payload.type, payload.amount, payload.category, payload.description,
    )
    await db.commit()
    await db.refresh(txn)
    return txn


@router.get("/summary", response_model=FinanceSummaryResponse)
async def summary(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    return await get_financial_summary(db, business.id)
