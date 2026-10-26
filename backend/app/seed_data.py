"""
Seed script: creates one demo business with products, customers, and a few
transactions so you can explore the app immediately without manual setup.

Run from the backend/ directory with the venv active:
    python -m app.seed_data

Idempotent-ish: if the demo user already exists, it exits without duplicating data.
"""
import asyncio

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.database.init_db import init_db
from app.models.user import User, Business
from app.models.product import Product, Inventory
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType
from app.services.auth_service import hash_password

DEMO_EMAIL = "demo@companyos.dev"
DEMO_PASSWORD = "demo1234"


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        if existing.scalar_one_or_none():
            print(f"Demo user '{DEMO_EMAIL}' already exists. Skipping seed.")
            return

        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Demo Owner",
        )
        db.add(user)
        await db.flush()

        business = Business(owner_id=user.id, name="Demo Threads Co.", industry="Apparel", currency="INR")
        db.add(business)
        await db.flush()

        products_data = [
            {"name": "Shirt", "sku": "SHIRT-01", "price": 500, "cost": 200, "qty": 12, "threshold": 5},
            {"name": "Kurta", "sku": "KURTA-01", "price": 900, "cost": 400, "qty": 3, "threshold": 5},  # low stock on purpose
            {"name": "Tote Bag", "sku": "BAG-01", "price": 300, "cost": 100, "qty": 20, "threshold": 4},
        ]
        for p in products_data:
            product = Product(business_id=business.id, name=p["name"], sku=p["sku"], price=p["price"], cost=p["cost"])
            db.add(product)
            await db.flush()
            db.add(Inventory(
                product_id=product.id, business_id=business.id,
                quantity=p["qty"], low_stock_threshold=p["threshold"],
            ))

        customers_data = [
            {"name": "Priya Sharma", "email": "priya@example.com", "is_vip": True},
            {"name": "Rahul Verma", "email": "rahul@example.com", "is_vip": False},
        ]
        for c in customers_data:
            db.add(Customer(business_id=business.id, **c))

        # A couple of historical transactions, including one deliberately "unusual" expense
        db.add(Transaction(
            business_id=business.id, type=TransactionType.REVENUE, amount=2400,
            category="sales", description="Opening week sales",
        ))
        db.add(Transaction(
            business_id=business.id, type=TransactionType.EXPENSE, amount=6500,
            category="supplies", description="Bulk fabric purchase", is_flagged_unusual=True,
        ))

        await db.commit()

        print("Seed complete.")
        print(f"  Login email:    {DEMO_EMAIL}")
        print(f"  Login password: {DEMO_PASSWORD}")
        print(f"  Business:       {business.name}")


if __name__ == "__main__":
    asyncio.run(seed())
