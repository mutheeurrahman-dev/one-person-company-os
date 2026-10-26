from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.customer import Customer
from app.schemas.business import CustomerCreate, CustomerResponse
from app.services.deps import get_current_business

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[CustomerResponse])
async def list_customers(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.business_id == business.id))
    return result.scalars().all()


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    payload: CustomerCreate, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    customer = Customer(business_id=business.id, **payload.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.business_id == business.id)
    )
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
