"""
Shift schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ShiftBase(BaseModel):
    """Base shift schema with common fields."""
    store_id: int = Field(..., description="Store ID")
    notes: Optional[str] = Field(None, description="Shift notes")


class ShiftOpenRequest(BaseModel):
    """Schema for opening a new shift."""
    store_id: int = Field(..., description="Store ID")
    initial_cash: float = Field(..., ge=0, description="Initial cash amount")
    inventory_balance: Optional[float] = Field(None, ge=0, description="Inventory beginning balance (if required)")


class ShiftResponse(BaseModel):
    """Schema for shift response."""
    id: int
    store_id: int
    shift_number: str
    status: str
    opened_by_user_id: Optional[int] = None
    closed_by_user_id: Optional[int] = None
    opened_at: datetime
    closed_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ShiftUpdate(BaseModel):
    """Schema for updating a shift."""
    notes: Optional[str] = None


class ShiftCloseRequest(BaseModel):
    """Schema for closing a shift."""
    notes: Optional[str] = None


class ShiftInventoryEntryResponse(BaseModel):
    """Schema for shift inventory entry response."""
    rec_id: int
    shift_id: int
    entry_type: str  # 'beg_bal', 'refill', 'end_bal'
    product_id: Optional[int] = None
    material_id: Optional[int] = None
    uofm_id: int
    quantity: float
    created_dt: datetime
    # Include related data
    product_name: Optional[str] = None
    material_name: Optional[str] = None
    uofm_abbreviation: Optional[str] = None

    class Config:
        from_attributes = True
