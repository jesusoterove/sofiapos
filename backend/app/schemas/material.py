"""
Pydantic schemas for Material (Ingredient) management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class MaterialBase(BaseModel):
    """Base schema for Material."""
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    requires_inventory: bool = Field(default=True)
    base_uofm_id: Optional[int] = None
    unit_cost: Optional[Decimal] = Field(None, ge=0)


class MaterialCreate(MaterialBase):
    """Schema for creating a Material."""
    pass


class MaterialUpdate(BaseModel):
    """Schema for updating a Material."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    requires_inventory: Optional[bool] = None
    base_uofm_id: Optional[int] = None
    unit_cost: Optional[Decimal] = Field(None, ge=0)


class MaterialResponse(BaseModel):
    """Schema for Material response."""
    id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    requires_inventory: bool
    base_uofm_id: Optional[int] = None
    unit_cost: Optional[float] = Field(None, ge=0)  # Float instead of Decimal for proper JSON serialization
    created_at: datetime
    updated_at: Optional[datetime] = None
    base_uofm_name: Optional[str] = None  # Will be populated from relationship

    class Config:
        from_attributes = True

