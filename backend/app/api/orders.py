from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.order import Order
from app.schemas.business import OrderResponse
from app.services.deps import get_current_business

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
async def list_orders(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.business_id == business.id).order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.business_id == business.id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
