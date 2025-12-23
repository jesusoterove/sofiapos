"""
Inventory entry and transaction schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.inventory import InventoryTransactionType


class InventoryEntryCreate(BaseModel):
    """Schema for creating an inventory entry."""
    store_id: int
    vendor_id: Optional[int] = None
    entry_number: Optional[str] = None  # If not provided, will be generated
    entry_type: InventoryTransactionType
    entry_date: datetime
    notes: Optional[str] = None
    created_by_user_id: Optional[int] = None
    shift_id: Optional[int] = None
    shift_number: Optional[str] = None


class InventoryEntryUpdate(BaseModel):
    """Schema for updating an inventory entry."""
    vendor_id: Optional[int] = None
    entry_type: Optional[InventoryTransactionType] = None
    entry_date: Optional[datetime] = None
    notes: Optional[str] = None


class InventoryEntryResponse(BaseModel):
    """Schema for inventory entry response."""
    id: int
    store_id: int
    vendor_id: Optional[int] = None
    entry_number: str
    entry_type: InventoryTransactionType
    entry_date: datetime
    notes: Optional[str] = None
    created_by_user_id: Optional[int] = None
    shift_id: Optional[int] = None
    shift_number: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryTransactionCreate(BaseModel):
    """Schema for creating an inventory transaction."""
    entry_id: Optional[int] = None  # If not provided, will be inferred from entry_number
    entry_number: Optional[str] = None  # Used to find entry_id if entry_id not provided
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: float = Field(..., gt=0)
    unit_of_measure_id: Optional[int] = None
    unit_cost: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class InventoryTransactionUpdate(BaseModel):
    """Schema for updating an inventory transaction."""
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: Optional[float] = Field(None, gt=0)
    unit_of_measure_id: Optional[int] = None
    unit_cost: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    """Schema for inventory transaction response."""
    id: int
    entry_id: int
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: float
    unit_of_measure_id: Optional[int] = None
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

