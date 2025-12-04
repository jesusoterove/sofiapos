"""
Pydantic schemas for Product management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    """Base schema for Product."""
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: Optional[int] = None
    requires_inventory: bool = Field(default=False)
    is_active: bool = Field(default=True)
    is_top_selling: bool = Field(default=False)
    allow_sell_without_inventory: bool = Field(default=False)
    selling_price: Decimal = Field(..., ge=0)


class ProductCreate(ProductBase):
    """Schema for creating a Product."""
    store_id: int


class ProductUpdate(BaseModel):
    """Schema for updating a Product."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: Optional[int] = None
    requires_inventory: Optional[bool] = None
    is_active: Optional[bool] = None
    is_top_selling: Optional[bool] = None
    allow_sell_without_inventory: Optional[bool] = None
    selling_price: Optional[Decimal] = Field(None, ge=0)


class ProductResponse(ProductBase):
    """Schema for Product response."""
    id: int
    store_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

