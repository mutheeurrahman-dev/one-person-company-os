import enum
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, Enum, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.user import gen_uuid


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    WAITING_APPROVAL = "waiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class AgentName(str, enum.Enum):
    MANAGER = "manager_agent"
    FINANCE = "finance_agent"
    OPERATIONS = "operations_agent"
    CUSTOMER = "customer_agent"
    MARKETING = "marketing_agent"


class Workflow(Base):
    """A single top-level user request and everything it spawns."""
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    user_request: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING)
    result_summary: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentTask(Base):
    """A single unit of work the Manager Agent delegates to a specialized agent."""
    __tablename__ = "agent_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    workflow_id: Mapped[str] = mapped_column(String, ForeignKey("workflows.id"), index=True, nullable=False)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    assigned_agent: Mapped[AgentName] = mapped_column(Enum(AgentName), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING)
    result: Mapped[dict] = mapped_column(JSON, nullable=True)
    error: Mapped[str] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=2)
    sequence: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentExecution(Base):
    """A log entry for a single agent 'turn' — used to power the live activity feed."""
    __tablename__ = "agent_executions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    workflow_id: Mapped[str] = mapped_column(String, ForeignKey("workflows.id"), index=True, nullable=False)
    task_id: Mapped[str] = mapped_column(String, ForeignKey("agent_tasks.id"), nullable=True)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    agent: Mapped[AgentName] = mapped_column(Enum(AgentName), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)  # started | success | failed | retrying
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AgentMessage(Base):
    """Structured agent-to-agent message (the manager<->specialist protocol)."""
    __tablename__ = "agent_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    workflow_id: Mapped[str] = mapped_column(String, ForeignKey("workflows.id"), index=True, nullable=False)
    task_id: Mapped[str] = mapped_column(String, ForeignKey("agent_tasks.id"), nullable=True)
    sender: Mapped[AgentName] = mapped_column(Enum(AgentName), nullable=False)
    receiver: Mapped[AgentName] = mapped_column(Enum(AgentName), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
