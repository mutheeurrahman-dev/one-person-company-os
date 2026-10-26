from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base_agent import BaseAgent
from app.models.agent_task import AgentTask
from app.tools import customer_tools


class CustomerAgent(BaseAgent):
    name = "customer_agent"

    async def execute(self, db: AsyncSession, task: AgentTask, business_id: str) -> dict:
        action = task.action
        payload = task.payload or {}

        if action == "find_or_create_customer":
            customer = await customer_tools.find_or_create_customer(
                db, business_id, payload.get("customer_name", "Guest Customer")
            )
            return {"customer_id": customer.id, "customer_name": customer.name}

        if action == "generate_confirmation":
            message = await customer_tools.generate_confirmation_message(
                payload.get("customer_name", "there"),
                payload.get("product_name", "your item"),
                payload.get("quantity", 1),
            )
            return {"message": message}

        if action == "list_important_customers":
            customers = await customer_tools.get_important_customers(db, business_id)
            return {"important_customers": customers}

        raise ValueError(f"Unknown action for CustomerAgent: {action}")
