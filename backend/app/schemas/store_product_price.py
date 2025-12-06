"""
Pydantic schemas for StoreProductPrice management.
"""
from pydantic import BaseModel, Field, field_validator
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


class StoreProductPriceResponse(BaseModel):
    """Schema for StoreProductPrice response."""
    id: int
    store_id: int
    product_id: int
    selling_price: float = Field(..., ge=0)  # Float instead of Decimal for proper JSON serialization
    created_at: datetime
    updated_at: Optional[datetime] = None
    store_name: Optional[str] = None  # Populated from relationship

    @field_validator('selling_price', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for proper JSON serialization."""
        if isinstance(v, Decimal):
            return float(v)
        return v

    class Config:
        from_attributes = True

