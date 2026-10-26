from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base_agent import BaseAgent
from app.models.agent_task import AgentTask
from app.tools import finance_tools


class FinanceAgent(BaseAgent):
    name = "finance_agent"

    async def execute(self, db: AsyncSession, task: AgentTask, business_id: str) -> dict:
        action = task.action
        payload = task.payload or {}

        if action == "record_revenue":
            txn = await finance_tools.record_transaction(
                db, business_id, "revenue", payload["amount"],
                category=payload.get("category", "sales"),
                description=payload.get("description"),
                related_order_id=payload.get("order_id"),
            )
            return {"transaction_id": txn.id, "amount": txn.amount, "type": "revenue"}

        if action == "record_expense":
            txn = await finance_tools.record_transaction(
                db, business_id, "expense", payload["amount"],
                category=payload.get("category", "general"),
                description=payload.get("description"),
            )
            return {
                "transaction_id": txn.id,
                "amount": txn.amount,
                "type": "expense",
                "flagged_unusual": txn.is_flagged_unusual,
            }

        if action == "get_summary":
            summary = await finance_tools.get_financial_summary(db, business_id)
            return summary

        raise ValueError(f"Unknown action for FinanceAgent: {action}")
