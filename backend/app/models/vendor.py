"""
Vendor model for supplier management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Vendor(Base):
    """Vendor model for supplier management."""
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(100), unique=True, nullable=True, index=True)
    contact_person = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    tax_id = Column(String(100))  # Tax identification number
    notes = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    inventory_entries = relationship("InventoryEntry", back_populates="vendor")

    def __repr__(self):
        return f"<Vendor(id={self.id}, name='{self.name}', code='{self.code}')>"

