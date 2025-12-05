"""
Pydantic schemas for Product management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.product import ProductType


class ProductBase(BaseModel):
    """Base schema for Product."""
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: Optional[int] = None
    product_type: ProductType = Field(default=ProductType.SALES_INVENTORY)
    is_active: bool = Field(default=True)
    selling_price: Decimal = Field(..., ge=0)


class ProductCreate(ProductBase):
    """Schema for creating a Product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a Product."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category_id: Optional[int] = None
    product_type: Optional[ProductType] = None
    is_active: Optional[bool] = None
    selling_price: Optional[Decimal] = Field(None, ge=0)


class ProductResponse(ProductBase):
    """Schema for Product response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

