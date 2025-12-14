"""
Order schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class OrderItemBase(BaseModel):
    """Base order item schema."""
    product_id: int = Field(..., description="Product ID")
    quantity: float = Field(..., ge=0, description="Quantity")
    unit_of_measure_id: Optional[int] = Field(None, description="Unit of measure ID")
    unit_price: float = Field(..., ge=0, description="Unit price")
    discount_amount: float = Field(0, ge=0, description="Discount amount")
    tax_amount: float = Field(0, ge=0, description="Tax amount")
    total: float = Field(..., ge=0, description="Total amount")
    notes: Optional[str] = Field(None, description="Item notes")
    display_order: int = Field(0, ge=0, description="Display order")


class OrderItemCreate(OrderItemBase):
    """Schema for creating an order item."""
    pass


class OrderItemResponse(OrderItemBase):
    """Schema for order item response."""
    id: int
    order_id: int

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """Base order schema with common fields."""
    store_id: int = Field(..., description="Store ID")
    shift_id: Optional[int] = Field(None, description="Shift ID")
    cash_register_id: Optional[int] = Field(None, description="Cash register ID")
    table_id: Optional[int] = Field(None, description="Table ID")
    customer_id: Optional[int] = Field(None, description="Customer ID")
    notes: Optional[str] = Field(None, description="Order notes")


class OrderCreate(OrderBase):
    """Schema for creating a new order."""
    order_number: Optional[str] = Field(None, description="Order number (if provided, will be used instead of generating one)")
    status: str = Field(..., description="Order status: draft, open, paid, cancelled")
    subtotal: float = Field(..., ge=0, description="Subtotal amount")
    tax_amount: Optional[float] = Field(0, ge=0, description="Tax amount (alias: taxes)")
    taxes: Optional[float] = Field(None, ge=0, description="Tax amount (alternative field name)")
    discount_amount: Optional[float] = Field(0, ge=0, description="Discount amount (alias: discount)")
    discount: Optional[float] = Field(None, ge=0, description="Discount amount (alternative field name)")
    total: float = Field(..., ge=0, description="Total amount")
    items: Optional[List[OrderItemCreate]] = Field(default_factory=list, description="Order items")


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    status: Optional[str] = Field(None, description="Order status")
    subtotal: Optional[float] = Field(None, ge=0, description="Subtotal amount")
    tax_amount: Optional[float] = Field(None, ge=0, description="Tax amount")
    discount_amount: Optional[float] = Field(None, ge=0, description="Discount amount")
    total: Optional[float] = Field(None, ge=0, description="Total amount")
    notes: Optional[str] = Field(None, description="Order notes")
    table_id: Optional[int] = Field(None, description="Table ID")
    customer_id: Optional[int] = Field(None, description="Customer ID")


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    store_id: int
    shift_id: Optional[int] = None
    cash_register_id: Optional[int] = None
    table_id: Optional[int] = None
    customer_id: Optional[int] = None
    user_id: int
    order_number: str
    status: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    items: Optional[List[OrderItemResponse]] = None

    class Config:
        from_attributes = True

