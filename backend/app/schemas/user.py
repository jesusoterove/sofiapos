"""
User schemas for API requests and responses.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    email: EmailStr = Field(..., description="Email address")
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    store_id: Optional[int] = Field(None, description="Associated store ID")
    is_active: bool = Field(True, description="Whether user is active")
    is_superuser: bool = Field(False, description="Whether user is superuser")
    role_ids: List[int] = Field(default_factory=list, description="List of role IDs")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=6, description="Password")


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    store_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, description="New password (optional)")
    role_ids: Optional[List[int]] = None


class RoleInfo(BaseModel):
    """Role information in user response."""
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class StoreInfo(BaseModel):
    """Store information in user response."""
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    roles: List[RoleInfo] = Field(default_factory=list)
    store: Optional[StoreInfo] = None

    class Config:
        from_attributes = True


class UserDeleteRequest(BaseModel):
    """Schema for user deletion request."""
    password: str = Field(..., description="User password for confirmation")
    force: bool = Field(False, description="Force physical deletion even with transactions")


class UserDeleteResponse(BaseModel):
    """Schema for user deletion response."""
    deleted: bool
    message: str
    deleted_physically: bool

