"""
Pydantic schemas for KitComponent management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class KitComponentBase(BaseModel):
    """Base schema for KitComponent."""
    product_id: int  # Kit product
    component_id: int  # Component product
    quantity: Decimal = Field(..., ge=0)


class KitComponentCreate(KitComponentBase):
    """Schema for creating a KitComponent."""
    pass


class KitComponentUpdate(BaseModel):
    """Schema for updating a KitComponent."""
    quantity: Optional[Decimal] = Field(None, ge=0)


class KitComponentResponse(KitComponentBase):
    """Schema for KitComponent response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    component_name: Optional[str] = None  # Populated from relationship
    component_code: Optional[str] = None  # Populated from relationship

    class Config:
        from_attributes = True

