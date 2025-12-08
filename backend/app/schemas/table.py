"""
Pydantic schemas for Table management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TableBase(BaseModel):
    """Base schema for Table."""
    table_number: str = Field(..., min_length=1, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    capacity: int = Field(default=4, ge=1)
    location: Optional[str] = Field(None, max_length=255)
    is_active: bool = Field(default=True)


class TableCreate(TableBase):
    """Schema for creating a Table."""
    store_id: int


class TableUpdate(BaseModel):
    """Schema for updating a Table."""
    table_number: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    capacity: Optional[int] = Field(None, ge=1)
    location: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class TableResponse(BaseModel):
    """Schema for Table response."""
    id: int
    store_id: int
    table_number: str
    name: Optional[str] = None
    capacity: int
    location: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

