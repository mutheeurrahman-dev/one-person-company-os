from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import Business
from app.models.product import Product, Inventory
from app.schemas.business import ProductCreate, ProductResponse, InventoryAdjust
from app.services.deps import get_current_business

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


async def _to_response(db: AsyncSession, product: Product) -> ProductResponse:
    result = await db.execute(select(Inventory).where(Inventory.product_id == product.id))
    inv = result.scalar_one_or_none()
    return ProductResponse(
        id=product.id, name=product.name, sku=product.sku, price=product.price, cost=product.cost,
        quantity=inv.quantity if inv else 0,
        low_stock_threshold=inv.low_stock_threshold if inv else 5,
        is_low_stock=inv.is_low_stock if inv else False,
    )


@router.get("/products", response_model=list[ProductResponse])
async def list_products(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.business_id == business.id))
    products = result.scalars().all()
    return [await _to_response(db, p) for p in products]


@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(
    payload: ProductCreate, business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    product = Product(
        business_id=business.id, name=payload.name, sku=payload.sku,
        price=payload.price, cost=payload.cost,
    )
    db.add(product)
    await db.flush()

    inv = Inventory(
        product_id=product.id, business_id=business.id,
        quantity=payload.initial_quantity, low_stock_threshold=payload.low_stock_threshold,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(product)
    return await _to_response(db, product)


@router.patch("/products/{product_id}/adjust", response_model=ProductResponse)
async def adjust_inventory(
    product_id: str, payload: InventoryAdjust,
    business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.business_id == business.id)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    inv_result = await db.execute(select(Inventory).where(Inventory.product_id == product_id))
    inv = inv_result.scalar_one_or_none()
    if inv is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    inv.quantity = max(0, inv.quantity + payload.quantity_delta)
    await db.commit()
    await db.refresh(product)
    return await _to_response(db, product)


@router.get("/low-stock")
async def low_stock(business: Business = Depends(get_current_business), db: AsyncSession = Depends(get_db)):
    from app.tools.inventory_tools import get_low_stock_products
    return await get_low_stock_products(db, business.id)
