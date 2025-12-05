"""
Pydantic schemas for RecipeMaterial management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class RecipeMaterialBase(BaseModel):
    """Base schema for RecipeMaterial."""
    recipe_id: int
    material_id: int
    quantity: Decimal = Field(..., ge=0)
    unit_of_measure_id: Optional[int] = None


class RecipeMaterialCreate(RecipeMaterialBase):
    """Schema for creating a RecipeMaterial."""
    pass


class RecipeMaterialUpdate(BaseModel):
    """Schema for updating a RecipeMaterial."""
    quantity: Optional[Decimal] = Field(None, ge=0)
    unit_of_measure_id: Optional[int] = None


class RecipeMaterialResponse(RecipeMaterialBase):
    """Schema for RecipeMaterial response."""
    id: int
    display_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    material_name: Optional[str] = None  # Populated from relationship
    material_code: Optional[str] = None  # Populated from relationship
    unit_of_measure_name: Optional[str] = None  # Populated from relationship

    class Config:
        from_attributes = True

