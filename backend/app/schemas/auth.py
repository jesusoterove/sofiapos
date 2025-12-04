"""
Authentication schemas.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str
    password: str


class UserInfo(BaseModel):
    """User information in login response."""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    store_id: Optional[int]


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class UserResponse(BaseModel):
    """User response schema."""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    store_id: Optional[int]

    class Config:
        from_attributes = True

