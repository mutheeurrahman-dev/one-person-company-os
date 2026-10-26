"""
Operations tools: real DB reads/writes for inventory and orders.
These are called by the Operations Agent — no mocked data.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product, Inventory
from app.models.order import Order, OrderStatus


async def find_product_by_name(db: AsyncSession, business_id: str, name: str) -> Product | None:
    result = await db.execute(
        select(Product).where(Product.business_id == business_id, Product.name.ilike(f"%{name}%"))
    )
    return result.scalars().first()


async def get_inventory_for_product(db: AsyncSession, product_id: str) -> Inventory | None:
    result = await db.execute(select(Inventory).where(Inventory.product_id == product_id))
    return result.scalar_one_or_none()


async def check_and_reserve_stock(db: AsyncSession, business_id: str, product_id: str, quantity: int) -> dict:
    inv = await get_inventory_for_product(db, product_id)
    if inv is None:
        raise ValueError("No inventory record found for this product")
    if inv.quantity < quantity:
        raise ValueError(f"Insufficient stock: have {inv.quantity}, need {quantity}")
    inv.quantity -= quantity
    await db.flush()
    return {"remaining_quantity": inv.quantity, "is_low_stock": inv.is_low_stock}


async def create_order_record(
    db: AsyncSession, business_id: str, product: Product, customer_id: str | None,
    quantity: int, workflow_id: str,
) -> Order:
    order = Order(
        business_id=business_id,
        product_id=product.id,
        customer_id=customer_id,
        quantity=quantity,
        total_amount=round(product.price * quantity, 2),
        status=OrderStatus.PROCESSING,
        workflow_id=workflow_id,
    )
    db.add(order)
    await db.flush()
    return order


async def get_low_stock_products(db: AsyncSession, business_id: str) -> list[dict]:
    result = await db.execute(
        select(Product, Inventory)
        .join(Inventory, Inventory.product_id == Product.id)
        .where(Product.business_id == business_id)
    )
    rows = result.all()
    return [
        {"product_id": p.id, "name": p.name, "quantity": inv.quantity, "threshold": inv.low_stock_threshold}
        for p, inv in rows if inv.quantity <= inv.low_stock_threshold
    ]
