"""
Pydantic schemas for StoreProductPrice management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class StoreProductPriceBase(BaseModel):
    """Base schema for StoreProductPrice."""
    store_id: int
    product_id: int
    selling_price: Decimal = Field(..., ge=0)


class StoreProductPriceCreate(StoreProductPriceBase):
    """Schema for creating a StoreProductPrice."""
    pass


class StoreProductPriceUpdate(BaseModel):
    """Schema for updating a StoreProductPrice."""
    selling_price: Optional[Decimal] = Field(None, ge=0)


class StoreProductPriceResponse(StoreProductPriceBase):
    """Schema for StoreProductPrice response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    store_name: Optional[str] = None  # Populated from relationship

    class Config:
        from_attributes = True

