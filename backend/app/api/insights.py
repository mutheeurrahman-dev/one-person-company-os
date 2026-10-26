from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.approval import BusinessInsight
from app.schemas.agents import InsightResponse
from app.services.deps import get_current_business
from app.services.insight_engine import generate_insights

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=list[InsightResponse])
async def list_insights(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BusinessInsight)
        .where(BusinessInsight.business_id == business.id)
        .order_by(BusinessInsight.created_at.desc())
    )
    return result.scalars().all()


@router.post("/refresh", response_model=list[InsightResponse])
async def refresh_insights(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    """Manually re-run insight detection against current business data."""
    await generate_insights(db, business.id)
    result = await db.execute(
        select(BusinessInsight)
        .where(BusinessInsight.business_id == business.id)
        .order_by(BusinessInsight.created_at.desc())
    )
    return result.scalars().all()
