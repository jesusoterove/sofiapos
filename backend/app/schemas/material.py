"""
Pydantic schemas for Material (Ingredient) management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MaterialBase(BaseModel):
    """Base schema for Material."""
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    requires_inventory: bool = Field(default=True)


class MaterialCreate(MaterialBase):
    """Schema for creating a Material."""
    pass


class MaterialUpdate(BaseModel):
    """Schema for updating a Material."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    requires_inventory: Optional[bool] = None


class MaterialResponse(MaterialBase):
    """Schema for Material response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

