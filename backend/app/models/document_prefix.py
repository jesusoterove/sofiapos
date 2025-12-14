"""
Document prefix configuration model for managing document number prefixes.
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DocumentType(str, enum.Enum):
    """Document type enumeration."""
    SHIFT = "shift"
    INVOICE = "invoice"
    INVENTORY = "inventory"
    PAYMENT = "payment"


class DocumentPrefix(Base):
    """Document prefix configuration model."""
    __tablename__ = "document_prefixes"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=True, index=True)
    doc_type = Column(String(20), nullable=False, index=True)  # shift, invoice, inventory, payment
    prefix = Column(String(3), nullable=False)  # Up to 3 alphanumeric characters
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    store = relationship("Store", back_populates="document_prefixes")

    __table_args__ = (
        UniqueConstraint("store_id", "doc_type", name="uq_document_prefix_store_type"),
        Index("idx_document_prefix_store", "store_id"),
        Index("idx_document_prefix_type", "doc_type"),
    )

    def __repr__(self):
        return f"<DocumentPrefix(id={self.id}, store_id={self.store_id}, doc_type='{self.doc_type}', prefix='{self.prefix}')>"

