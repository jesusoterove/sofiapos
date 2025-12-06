"""
Pydantic schemas for Product management.
"""
from pydantic import BaseModel, Field, field_validator
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


class ProductResponse(BaseModel):
    """Schema for Product response."""
    id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    product_type: ProductType
    is_active: bool
    selling_price: float = Field(..., ge=0)  # Float instead of Decimal for proper JSON serialization
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_validator('selling_price', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for proper JSON serialization."""
        if isinstance(v, Decimal):
            return float(v)
        return v

    class Config:
        from_attributes = True

