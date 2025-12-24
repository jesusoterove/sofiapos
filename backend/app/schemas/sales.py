"""
Sales schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class SalesFilterRequest(BaseModel):
    """Schema for filtering sales data."""
    store_id: Optional[int] = Field(None, description="Store ID (None for all stores)")
    cash_register_id: Optional[int] = Field(None, description="Cash register ID (None for all)")
    filter_mode: str = Field(..., description="Filter mode: today, yesterday, current_shift, last_shift, last_week, last_month, date_range")
    start_date: Optional[datetime] = Field(None, description="Start date for date_range mode (should be in UTC)")
    end_date: Optional[datetime] = Field(None, description="End date for date_range mode (should be in UTC)")
    timezone_offset: Optional[int] = Field(None, description="Client timezone offset in minutes (e.g., -300 for EST, 0 for UTC)")


class SalesDetailsRequest(BaseModel):
    """Schema for requesting paginated sales details."""
    store_id: Optional[int] = Field(None, description="Store ID (None for all stores)")
    cash_register_id: Optional[int] = Field(None, description="Cash register ID (None for all)")
    filter_mode: str = Field(..., description="Filter mode: today, yesterday, current_shift, last_shift, last_week, last_month, date_range")
    start_date: Optional[datetime] = Field(None, description="Start date for date_range mode (should be in UTC)")
    end_date: Optional[datetime] = Field(None, description="End date for date_range mode (should be in UTC)")
    timezone_offset: Optional[int] = Field(None, description="Client timezone offset in minutes (e.g., -300 for EST, 0 for UTC)")
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(20, ge=1, le=100, description="Number of items per page")


class PaymentMethodSummary(BaseModel):
    """Summary of payments by payment method."""
    payment_method_name: str
    payment_method_type: str
    total_amount: float

    class Config:
        from_attributes = True


class SalesSummary(BaseModel):
    """Summary of sales data."""
    beginning_balance: Optional[float] = Field(None, description="Beginning balance if cash register selected")
    total_sales: float = Field(..., description="Total sales amount")
    payment_methods: List[PaymentMethodSummary] = Field(default_factory=list, description="Total by payment method")

    class Config:
        from_attributes = True


class SalesDetail(BaseModel):
    """Detail of a single sale (paid order)."""
    order_id: int
    order_number: str
    table_number: Optional[str] = None
    customer_name: Optional[str] = None
    cash_paid: float = Field(0, description="Cash payment amount")
    other_paid: float = Field(0, description="Other payment methods amount")
    total_paid: float = Field(..., description="Total paid amount")
    date: datetime = Field(..., description="Payment date")

    class Config:
        from_attributes = True


class SalesResponse(BaseModel):
    """Response for sales data."""
    summary: SalesSummary
    details: List[SalesDetail]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    cash_register_user: Optional[str] = Field(None, description="User in cash register during shift")

    class Config:
        from_attributes = True


class SalesSummaryResponse(BaseModel):
    """Response for sales summary only."""
    summary: SalesSummary
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    cash_register_user: Optional[str] = Field(None, description="User in cash register during shift")

    class Config:
        from_attributes = True


class SalesDetailsResponse(BaseModel):
    """Response for paginated sales details."""
    details: List[SalesDetail]
    total_count: int = Field(..., description="Total number of records")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Page size")
    total_pages: int = Field(..., description="Total number of pages")

    class Config:
        from_attributes = True

