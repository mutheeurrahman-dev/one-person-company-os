"""
Customer tools: real DB reads/writes for customer records and messages.
Called by the Customer Agent.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.services.llm_provider import get_llm_provider


async def find_or_create_customer(db: AsyncSession, business_id: str, name: str) -> Customer:
    result = await db.execute(
        select(Customer).where(Customer.business_id == business_id, Customer.name.ilike(name))
    )
    existing = result.scalars().first()
    if existing:
        return existing
    customer = Customer(business_id=business_id, name=name)
    db.add(customer)
    await db.flush()
    return customer


async def generate_confirmation_message(customer_name: str, product_name: str, quantity: int) -> str:
    provider = get_llm_provider()
    text = await provider.generate_text(
        system_prompt=(
            "You are the Customer Agent for a small business. Write a short, warm, "
            "professional order-confirmation message to a customer. 2-3 sentences max."
        ),
        user_prompt=f"Customer: {customer_name}. Order: {quantity} x {product_name}.",
    )
    if text.startswith("[rule-based]"):
        return (
            f"Hi {customer_name}, thank you for your order of {quantity} x {product_name}! "
            f"We're preparing it now and will notify you once it ships."
        )
    return text


async def get_important_customers(db: AsyncSession, business_id: str) -> list[dict]:
    result = await db.execute(
        select(Customer).where(Customer.business_id == business_id, Customer.is_vip == True)  # noqa: E712
    )
    return [{"id": c.id, "name": c.name} for c in result.scalars().all()]
