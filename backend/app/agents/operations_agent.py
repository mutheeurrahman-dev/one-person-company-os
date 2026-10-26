from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base_agent import BaseAgent
from app.models.agent_task import AgentTask
from app.tools import inventory_tools


class OperationsAgent(BaseAgent):
    name = "operations_agent"

    async def execute(self, db: AsyncSession, task: AgentTask, business_id: str) -> dict:
        action = task.action
        payload = task.payload or {}

        if action == "check_inventory":
            product = await inventory_tools.find_product_by_name(db, business_id, payload["product_name"])
            if product is None:
                raise ValueError(f"Product '{payload['product_name']}' not found")
            inv = await inventory_tools.get_inventory_for_product(db, product.id)
            if inv is None:
                raise ValueError("No inventory record for this product")
            if inv.quantity < payload.get("quantity", 1):
                raise ValueError(
                    f"Insufficient stock for {product.name}: have {inv.quantity}, "
                    f"need {payload.get('quantity', 1)}"
                )
            return {"product_id": product.id, "product_name": product.name, "available": inv.quantity}

        if action == "process_order":
            product = await inventory_tools.find_product_by_name(db, business_id, payload["product_name"])
            if product is None:
                raise ValueError(f"Product '{payload['product_name']}' not found")
            stock_result = await inventory_tools.check_and_reserve_stock(
                db, business_id, product.id, payload["quantity"]
            )
            order = await inventory_tools.create_order_record(
                db, business_id, product, payload.get("customer_id"),
                payload["quantity"], task.workflow_id,
            )
            return {
                "order_id": order.id,
                "product_id": product.id,
                "product_name": product.name,
                "price": product.price,
                "quantity": payload["quantity"],
                "total_amount": order.total_amount,
                "remaining_stock": stock_result["remaining_quantity"],
                "is_low_stock": stock_result["is_low_stock"],
            }

        if action == "check_low_stock":
            low_stock = await inventory_tools.get_low_stock_products(db, business_id)
            return {"low_stock_products": low_stock, "count": len(low_stock)}

        raise ValueError(f"Unknown action for OperationsAgent: {action}")
