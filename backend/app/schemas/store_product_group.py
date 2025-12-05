"""
Pydantic schemas for StoreProductGroup management.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StoreProductGroupBase(BaseModel):
    """Base schema for StoreProductGroup."""
    store_id: int
    group_name: str = Field(..., min_length=1, max_length=255)


class StoreProductGroupCreate(StoreProductGroupBase):
    """Schema for creating a StoreProductGroup."""
    pass


class StoreProductGroupUpdate(BaseModel):
    """Schema for updating a StoreProductGroup."""
    group_name: Optional[str] = Field(None, min_length=1, max_length=255)


class StoreProductGroupResponse(StoreProductGroupBase):
    """Schema for StoreProductGroup response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductGroupAssignment(BaseModel):
    """Schema for assigning/unassigning products to groups."""
    group_id: int
    assigned: bool

