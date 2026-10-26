"""
Finance tools: real DB reads/writes for transactions and financial summaries.
Called by the Finance Agent.
"""
from datetime import datetime, time

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType

UNUSUAL_EXPENSE_THRESHOLD = 5000.0


async def record_transaction(
    db: AsyncSession, business_id: str, type_: str, amount: float,
    category: str = "general", description: str | None = None, related_order_id: str | None = None,
) -> Transaction:
    is_unusual = type_ == "expense" and amount >= UNUSUAL_EXPENSE_THRESHOLD
    txn = Transaction(
        business_id=business_id,
        type=TransactionType(type_),
        amount=amount,
        category=category,
        description=description,
        related_order_id=related_order_id,
        is_flagged_unusual=is_unusual,
    )
    db.add(txn)
    await db.flush()
    return txn


async def get_financial_summary(db: AsyncSession, business_id: str) -> dict:
    result = await db.execute(select(Transaction).where(Transaction.business_id == business_id))
    txns = result.scalars().all()

    total_revenue = sum(t.amount for t in txns if t.type == TransactionType.REVENUE)
    total_expenses = sum(t.amount for t in txns if t.type == TransactionType.EXPENSE)

    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_revenue = sum(
        t.amount for t in txns if t.type == TransactionType.REVENUE and t.created_at >= today_start
    )

    return {
        "total_revenue": round(total_revenue, 2),
        "total_expenses": round(total_expenses, 2),
        "profit": round(total_revenue - total_expenses, 2),
        "today_revenue": round(today_revenue, 2),
        "transaction_count": len(txns),
    }
