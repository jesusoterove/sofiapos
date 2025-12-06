"""
Store Product Price management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import StoreProductPrice, Store, Product, Setting
from app.schemas.store_product_price import (
    StoreProductPriceCreate, StoreProductPriceUpdate, StoreProductPriceResponse
)
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/store-product-prices", tags=["store-product-prices"])


def get_money_decimal_places(db: Session) -> int:
    """Get the configured number of decimal places for money values."""
    setting = db.query(Setting).filter(
        Setting.key == "money_decimal_places",
        Setting.store_id == None
    ).first()
    
    if setting and setting.value:
        try:
            return int(setting.value)
        except (ValueError, TypeError):
            pass
    
    return 2  # Default to 2 decimal places


def format_price(price: Optional[Decimal]) -> Optional[float]:
    """Convert price from Decimal to float without formatting."""
    if price is None:
        return None
    
    # Return raw float value without rounding
    return float(price)


@router.get("", response_model=List[StoreProductPriceResponse])
async def list_store_product_prices(
    product_id: Optional[int] = None,
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all store product prices."""
    query = db.query(StoreProductPrice).options(joinedload(StoreProductPrice.store))
    
    if product_id:
        query = query.filter(StoreProductPrice.product_id == product_id)
    
    if store_id:
        query = query.filter(StoreProductPrice.store_id == store_id)
    
    prices = query.all()
    
    # Convert to response format
    result = []
    for price in prices:
        result.append({
            "id": price.id,
            "store_id": price.store_id,
            "product_id": price.product_id,
            "selling_price": format_price(price.selling_price),
            "created_at": price.created_at,
            "updated_at": price.updated_at,
            "store_name": price.store.name if price.store else None,
        })
    return result


@router.get("/{price_id}", response_model=StoreProductPriceResponse)
async def get_store_product_price(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a store product price by ID."""
    price = db.query(StoreProductPrice).options(joinedload(StoreProductPrice.store)).filter(
        StoreProductPrice.id == price_id
    ).first()
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product price not found"
        )
    
    return {
        "id": price.id,
        "store_id": price.store_id,
        "product_id": price.product_id,
        "selling_price": format_price(price.selling_price),
        "created_at": price.created_at,
        "updated_at": price.updated_at,
        "store_name": price.store.name if price.store else None,
    }


@router.post("", response_model=StoreProductPriceResponse, status_code=status.HTTP_201_CREATED)
async def create_store_product_price(
    price_data: StoreProductPriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new store product price."""
    # Verify store exists
    store = db.query(Store).filter(Store.id == price_data.store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == price_data.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if price already exists for this store and product
    existing = db.query(StoreProductPrice).filter(
        StoreProductPrice.store_id == price_data.store_id,
        StoreProductPrice.product_id == price_data.product_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store product price already exists for this store and product"
        )
    
    price = StoreProductPrice(**price_data.model_dump())
    db.add(price)
    db.commit()
    db.refresh(price)
    
    # Reload with relationship
    price = db.query(StoreProductPrice).options(joinedload(StoreProductPrice.store)).filter(
        StoreProductPrice.id == price.id
    ).first()
    
    return {
        "id": price.id,
        "store_id": price.store_id,
        "product_id": price.product_id,
        "selling_price": format_price(price.selling_price),
        "created_at": price.created_at,
        "updated_at": price.updated_at,
        "store_name": price.store.name if price.store else None,
    }


@router.put("/{price_id}", response_model=StoreProductPriceResponse)
async def update_store_product_price(
    price_id: int,
    price_data: StoreProductPriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a store product price."""
    price = db.query(StoreProductPrice).filter(StoreProductPrice.id == price_id).first()
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product price not found"
        )
    
    # Update fields
    update_data = price_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(price, field, value)
    
    db.commit()
    db.refresh(price)
    
    # Reload with relationship
    price = db.query(StoreProductPrice).options(joinedload(StoreProductPrice.store)).filter(
        StoreProductPrice.id == price_id
    ).first()
    
    return {
        "id": price.id,
        "store_id": price.store_id,
        "product_id": price.product_id,
        "selling_price": format_price(price.selling_price),
        "created_at": price.created_at,
        "updated_at": price.updated_at,
        "store_name": price.store.name if price.store else None,
    }


@router.delete("/{price_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store_product_price(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a store product price."""
    price = db.query(StoreProductPrice).filter(StoreProductPrice.id == price_id).first()
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product price not found"
        )
    
    db.delete(price)
    db.commit()
    return None

