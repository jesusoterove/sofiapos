"""
Inventory control configuration schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class InventoryControlConfigResponse(BaseModel):
    """Schema for inventory control configuration response."""
    id: int
    item_type: str  # "Product" or "Material"
    product_id: Optional[int] = None
    material_id: Optional[int] = None
    show_in_inventory: bool
    priority: int
    uofm1_id: Optional[int] = None
    uofm2_id: Optional[int] = None
    uofm3_id: Optional[int] = None
    # Include related data for easier frontend use
    product_name: Optional[str] = None
    material_name: Optional[str] = None
    uofm1_abbreviation: Optional[str] = None
    uofm2_abbreviation: Optional[str] = None
    uofm3_abbreviation: Optional[str] = None

    class Config:
        from_attributes = True


class ShiftInventoryEntry(BaseModel):
    """Schema for a shift inventory entry."""
    product_id: Optional[int] = None
    material_id: Optional[int] = None
    uofm_id: int
    quantity: float = Field(..., ge=0)


class ShiftCloseWithInventoryRequest(BaseModel):
    """Schema for closing a shift with inventory entries."""
    final_cash: Optional[float] = Field(None, ge=0, description="Final cash amount")
    notes: Optional[str] = None
    inventory_entries: List[ShiftInventoryEntry] = Field(default_factory=list, description="End balance inventory entries")

