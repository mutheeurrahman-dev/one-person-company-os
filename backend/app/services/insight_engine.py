"""
Insight engine: real logic that inspects current business data and writes
BusinessInsight rows — this is what "detect unusual spending" and "generate
business insights" actually means, not a hardcoded static list.

Called after every workflow run (so insights build up from real activity)
and also exposed as a standalone command ("show me this week's business
performance" / "generate insights").
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType
from app.models.approval import BusinessInsight
from app.tools.inventory_tools import get_low_stock_products
from app.tools.finance_tools import get_financial_summary, UNUSUAL_EXPENSE_THRESHOLD


async def _insight_exists(db: AsyncSession, business_id: str, title: str) -> bool:
    result = await db.execute(
        select(BusinessInsight).where(
            BusinessInsight.business_id == business_id, BusinessInsight.title == title
        )
    )
    return result.scalar_one_or_none() is not None


async def generate_insights(db: AsyncSession, business_id: str) -> list[BusinessInsight]:
    """
    Runs a set of real checks against current business data and persists any
    newly-detected insight as a BusinessInsight row. Idempotent per title so
    re-running doesn't spam duplicate rows for the same unresolved condition.
    """
    created: list[BusinessInsight] = []

    # --- 1. Unusual spending detection ---
    txn_result = await db.execute(
        select(Transaction).where(
            Transaction.business_id == business_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.is_flagged_unusual == True,  # noqa: E712
        )
    )
    for txn in txn_result.scalars().all():
        title = f"Unusual expense: ₹{txn.amount:,.0f} ({txn.category})"
        if not await _insight_exists(db, business_id, title):
            insight = BusinessInsight(
                business_id=business_id,
                category="finance",
                title=title,
                detail=(
                    f"An expense of ₹{txn.amount:,.0f} in category '{txn.category}' exceeds the "
                    f"₹{UNUSUAL_EXPENSE_THRESHOLD:,.0f} threshold and was flagged for review."
                ),
                severity="warning",
            )
            db.add(insight)
            created.append(insight)

    # --- 2. Low stock detection ---
    low_stock = await get_low_stock_products(db, business_id)
    for item in low_stock:
        title = f"Low stock: {item['name']}"
        if not await _insight_exists(db, business_id, title):
            insight = BusinessInsight(
                business_id=business_id,
                category="operations",
                title=title,
                detail=(
                    f"'{item['name']}' has only {item['quantity']} units left "
                    f"(threshold: {item['threshold']}). Consider restocking soon."
                ),
                severity="critical" if item["quantity"] == 0 else "warning",
            )
            db.add(insight)
            created.append(insight)

    # --- 3. Profitability snapshot (always refreshed, category='finance') ---
    summary = await get_financial_summary(db, business_id)
    if summary["transaction_count"] > 0:
        title = "Business performance snapshot"
        # Remove the previous snapshot so this insight always reflects the latest numbers.
        existing = await db.execute(
            select(BusinessInsight).where(
                BusinessInsight.business_id == business_id, BusinessInsight.title == title
            )
        )
        old = existing.scalar_one_or_none()
        if old:
            await db.delete(old)
            await db.flush()

        margin = (
            round((summary["profit"] / summary["total_revenue"]) * 100, 1)
            if summary["total_revenue"] > 0 else 0.0
        )
        insight = BusinessInsight(
            business_id=business_id,
            category="finance",
            title=title,
            detail=(
                f"Total revenue ₹{summary['total_revenue']:,.0f}, expenses "
                f"₹{summary['total_expenses']:,.0f}, profit ₹{summary['profit']:,.0f} "
                f"({margin}% margin) across {summary['transaction_count']} transaction(s)."
            ),
            severity="info",
        )
        db.add(insight)
        created.append(insight)

    if created:
        await db.commit()
    return created
