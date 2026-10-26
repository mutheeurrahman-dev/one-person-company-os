import enum
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, Enum, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.user import gen_uuid


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    workflow_id: Mapped[str] = mapped_column(String, ForeignKey("workflows.id"), index=True, nullable=False)
    task_id: Mapped[str] = mapped_column(String, ForeignKey("agent_tasks.id"), nullable=True)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    requesting_agent: Mapped[str] = mapped_column(String, nullable=False)
    action_title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class BusinessInsight(Base):
    __tablename__ = "business_insights"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String, default="general")  # finance | ops | customer | marketing
    title: Mapped[str] = mapped_column(String, nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String, default="info")  # info | warning | critical
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SystemEvent(Base):
    """Generic audit trail for anything worth remembering across restarts."""
    __tablename__ = "system_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
