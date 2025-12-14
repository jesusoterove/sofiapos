"""
Document prefix schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.document_prefix import DocumentType


class DocumentPrefixBase(BaseModel):
    """Base document prefix schema with common fields."""
    doc_type: str = Field(..., description="Document type: shift, invoice, inventory, payment")
    prefix: str = Field(..., min_length=1, max_length=3, description="Document prefix (up to 3 alphanumeric characters)")
    is_active: bool = Field(True, description="Whether the prefix is active")


class DocumentPrefixCreate(DocumentPrefixBase):
    """Schema for creating a new document prefix."""
    store_id: Optional[int] = Field(None, description="Store ID (None for global defaults)")


class DocumentPrefixUpdate(BaseModel):
    """Schema for updating a document prefix."""
    prefix: Optional[str] = Field(None, min_length=1, max_length=3)
    is_active: Optional[bool] = None


class DocumentPrefixResponse(DocumentPrefixBase):
    """Schema for document prefix response."""
    id: int
    store_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

