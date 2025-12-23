"""
Pydantic schemas for ProductImage management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductImageCreate(BaseModel):
    """Schema for creating a ProductImage."""
    product_id: int
    image_url: str = Field(..., max_length=500)
    image_path: Optional[str] = Field(None, max_length=500)
    is_primary: bool = Field(default=False)
    display_order: int = Field(default=0, ge=0)


class ProductImageUpdate(BaseModel):
    """Schema for updating a ProductImage."""
    image_url: Optional[str] = Field(None, max_length=500)
    image_path: Optional[str] = Field(None, max_length=500)
    is_primary: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)


class ProductImageResponse(BaseModel):
    """Schema for ProductImage response."""
    id: int
    product_id: int
    image_url: str
    image_path: Optional[str] = None
    is_primary: bool
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True

