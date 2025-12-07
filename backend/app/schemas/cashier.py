"""
Cashier registration schemas for API requests and responses.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse, RoleInfo, StoreInfo


class CashierRegisterRequest(BaseModel):
    """Schema for registering a new cashier terminal (cash register only)."""
    registration_code: str = Field(..., min_length=1, max_length=100, description="Unique registration code for the cashier terminal")
    store_id: int = Field(..., description="Store ID where the cashier will work")
    name: str = Field(..., min_length=1, max_length=255, description="Cash register name")


class CashRegisterResponse(BaseModel):
    """Schema for cash register registration response."""
    id: int
    store_id: int
    name: str
    code: str
    is_active: bool
    registration_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class CashierUserCreateRequest(BaseModel):
    """Schema for creating a user for a cash register."""
    cash_register_id: int = Field(..., description="Cash register ID")
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name")


class CashierResponse(UserResponse):
    """Schema for cashier response (extends UserResponse)."""
    registration_code: Optional[str] = Field(None, description="Cashier registration code")
    cash_register_id: Optional[int] = Field(None, description="Associated cash register ID")
    cash_register_code: Optional[str] = Field(None, description="Associated cash register code")

    class Config:
        from_attributes = True

