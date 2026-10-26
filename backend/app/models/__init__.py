"""
Import all models here so that Base.metadata is fully populated
before create_all() is called (required for SQLAlchemy relationship resolution).
"""
from app.models.user import User, Business  # noqa
from app.models.product import Product, Inventory  # noqa
from app.models.customer import Customer  # noqa
from app.models.order import Order, OrderStatus  # noqa
from app.models.transaction import Transaction, TransactionType  # noqa
from app.models.agent_task import (  # noqa
    Workflow, AgentTask, AgentExecution, AgentMessage, TaskStatus, AgentName
)
from app.models.approval import ApprovalRequest, ApprovalStatus, BusinessInsight, SystemEvent  # noqa
