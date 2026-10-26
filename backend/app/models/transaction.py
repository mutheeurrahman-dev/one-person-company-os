import enum
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Float, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.user import gen_uuid


class TransactionType(str, enum.Enum):
    REVENUE = "revenue"
    EXPENSE = "expense"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, default="general")
    description: Mapped[str] = mapped_column(Text, nullable=True)
    related_order_id: Mapped[str] = mapped_column(String, nullable=True)
    is_flagged_unusual: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
