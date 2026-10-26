from datetime import datetime
from pydantic import BaseModel


class CommandRequest(BaseModel):
    text: str


class AgentTaskResponse(BaseModel):
    id: str
    workflow_id: str
    assigned_agent: str
    action: str
    status: str
    result: dict | None
    error: str | None
    retry_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AgentExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    agent: str
    status: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowResponse(BaseModel):
    id: str
    user_request: str
    status: str
    result_summary: str | None
    created_at: datetime
    tasks: list[AgentTaskResponse] = []

    class Config:
        from_attributes = True


class ApprovalResponse(BaseModel):
    id: str
    workflow_id: str
    requesting_agent: str
    action_title: str
    description: str | None
    estimated_cost: float
    reason: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalDecision(BaseModel):
    approve: bool


class InsightResponse(BaseModel):
    id: str
    category: str
    title: str
    detail: str
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    today_revenue: float
    total_orders: int
    pending_tasks: int
    active_agents: list[str]
    low_stock_count: int
    pending_approvals: int
    recent_customer_activity: list[str]
