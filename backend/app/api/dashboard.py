from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.order import Order
from app.models.agent_task import AgentTask, TaskStatus
from app.models.approval import ApprovalRequest, ApprovalStatus
from app.models.customer import Customer
from app.schemas.agents import DashboardResponse
from app.services.deps import get_current_business
from app.tools.finance_tools import get_financial_summary
from app.tools.inventory_tools import get_low_stock_products

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def dashboard(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    finance = await get_financial_summary(db, business.id)

    orders_result = await db.execute(select(Order).where(Order.business_id == business.id))
    total_orders = len(orders_result.scalars().all())

    pending_result = await db.execute(
        select(AgentTask).where(
            AgentTask.business_id == business.id,
            AgentTask.status.in_([TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.RETRYING]),
        )
    )
    pending_tasks = pending_result.scalars().all()
    active_agents = list({t.assigned_agent.value for t in pending_tasks})

    low_stock = await get_low_stock_products(db, business.id)

    approvals_result = await db.execute(
        select(ApprovalRequest).where(
            ApprovalRequest.business_id == business.id, ApprovalRequest.status == ApprovalStatus.PENDING
        )
    )
    pending_approvals = len(approvals_result.scalars().all())

    customers_result = await db.execute(
        select(Customer).where(Customer.business_id == business.id).order_by(Customer.created_at.desc()).limit(5)
    )
    recent_customers = [c.name for c in customers_result.scalars().all()]

    return DashboardResponse(
        today_revenue=finance["today_revenue"],
        total_orders=total_orders,
        pending_tasks=len(pending_tasks),
        active_agents=active_agents,
        low_stock_count=len(low_stock),
        pending_approvals=pending_approvals,
        recent_customer_activity=recent_customers,
    )
