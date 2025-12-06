"""
Pydantic schemas for KitComponent management.
"""
from pydantic import BaseModel, Field, field_validator
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


class KitComponentResponse(BaseModel):
    """Schema for KitComponent response."""
    id: int
    product_id: int  # Kit product
    component_id: int  # Component product
    quantity: float = Field(..., ge=0)  # Float instead of Decimal for proper JSON serialization
    created_at: datetime
    updated_at: Optional[datetime] = None
    component_name: Optional[str] = None  # Populated from relationship
    component_code: Optional[str] = None  # Populated from relationship

    @field_validator('quantity', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for proper JSON serialization."""
        if isinstance(v, Decimal):
            return float(v)
        return v

    class Config:
        from_attributes = True

