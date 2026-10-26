from datetime import datetime
from pydantic import BaseModel, Field


# ---------- Product / Inventory ----------
class ProductCreate(BaseModel):
    name: str
    sku: str | None = None
    price: float = 0.0
    cost: float = 0.0
    initial_quantity: int = 0
    low_stock_threshold: int = 5


class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str | None
    price: float
    cost: float
    quantity: int = 0
    low_stock_threshold: int = 5
    is_low_stock: bool = False

    class Config:
        from_attributes = True


class InventoryAdjust(BaseModel):
    quantity_delta: int
    reason: str | None = None


# ---------- Customer ----------
class CustomerCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    notes: str | None = None
    is_vip: bool = False


class CustomerResponse(BaseModel):
    id: str
    name: str
    email: str | None
    phone: str | None
    is_vip: bool
    has_unresolved_issue: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Order ----------
class OrderCreate(BaseModel):
    product_id: str
    customer_id: str | None = None
    customer_name: str | None = None  # convenience: create customer inline if given
    quantity: int = Field(gt=0)


class OrderResponse(BaseModel):
    id: str
    product_id: str
    customer_id: str | None
    quantity: int
    total_amount: float
    status: str
    workflow_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Transaction ----------
class TransactionCreate(BaseModel):
    type: str  # "revenue" | "expense"
    amount: float
    category: str = "general"
    description: str | None = None


class TransactionResponse(BaseModel):
    id: str
    type: str
    amount: float
    category: str
    description: str | None
    is_flagged_unusual: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FinanceSummaryResponse(BaseModel):
    total_revenue: float
    total_expenses: float
    profit: float
    today_revenue: float
    transaction_count: int
