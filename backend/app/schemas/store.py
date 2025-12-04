"""
Store schemas for API requests and responses.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class StoreBase(BaseModel):
    """Base store schema with common fields."""
    name: str = Field(..., min_length=1, max_length=255, description="Store name")
    code: str = Field(..., min_length=1, max_length=50, description="Unique store code")
    address: Optional[str] = Field(None, description="Store address")
    phone: Optional[str] = Field(None, max_length=50, description="Store phone number")
    email: Optional[EmailStr] = Field(None, description="Store email address")
    default_tables_count: int = Field(10, ge=0, description="Default number of tables")
    requires_start_inventory: bool = Field(False, description="Require inventory count at shift start")
    requires_end_inventory: bool = Field(False, description="Require inventory count at shift end")


class StoreCreate(StoreBase):
    """Schema for creating a new store."""
    pass


class StoreUpdate(BaseModel):
    """Schema for updating a store."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    default_tables_count: Optional[int] = Field(None, ge=0)
    requires_start_inventory: Optional[bool] = None
    requires_end_inventory: Optional[bool] = None


class StoreResponse(StoreBase):
    """Schema for store response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StoreDeleteRequest(BaseModel):
    """Schema for store deletion request."""
    password: str = Field(..., description="User password for confirmation")
    force: bool = Field(False, description="Force physical deletion even with transactions")


class StoreDeleteResponse(BaseModel):
    """Schema for store deletion response."""
    deleted: bool
    message: str
    deleted_physically: bool

