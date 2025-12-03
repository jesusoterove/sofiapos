"""
Table model for restaurant table management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Table(Base):
    """Table model for restaurant tables."""
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    table_number = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    capacity = Column(Integer, nullable=False, default=4)
    location = Column(String(255), nullable=True)  # e.g., "Indoor", "Outdoor", "Section A"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    store = relationship("Store", back_populates="tables")
    orders = relationship("Order", back_populates="table")

    def __repr__(self):
        return f"<Table(id={self.id}, table_number='{self.table_number}', name='{self.name}')>"

