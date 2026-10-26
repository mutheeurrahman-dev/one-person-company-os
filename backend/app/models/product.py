from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.user import gen_uuid


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    sku: Mapped[str] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    inventory: Mapped["Inventory"] = relationship(
        "Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan"
    )


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), unique=True, nullable=False)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id"), index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product: Mapped["Product"] = relationship("Product", back_populates="inventory")

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.low_stock_threshold
