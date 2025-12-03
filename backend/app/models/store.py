"""
Store model for managing multiple store locations.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Store(Base):
    """Store model representing a physical store location."""
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(255))
    is_active = Column(Boolean, default=True, nullable=False)
    default_tables_count = Column(Integer, default=10, nullable=False)
    requires_start_inventory = Column(Boolean, default=False, nullable=False)  # Require inventory count at shift start
    requires_end_inventory = Column(Boolean, default=False, nullable=False)  # Require inventory count at shift end
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="store")
    products = relationship("Product", back_populates="store")
    cash_registers = relationship("CashRegister", back_populates="store")
    shifts = relationship("Shift", back_populates="store")
    tables = relationship("Table", back_populates="store")
    orders = relationship("Order", back_populates="store")
    inventory_entries = relationship("InventoryEntry", back_populates="store")
    settings = relationship("Setting", back_populates="store")

    def __repr__(self):
        return f"<Store(id={self.id}, name='{self.name}', code='{self.code}')>"

