"""
Inventory models for inventory management and tracking.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class InventoryTransactionType(str, enum.Enum):
    """Types of inventory transactions."""
    PURCHASE = "purchase"
    SALE = "sale"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    WASTE = "waste"
    RETURN = "return"


class InventoryEntry(Base):
    """Inventory entry model for purchases and inventory transactions."""
    __tablename__ = "inventory_entries"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    entry_number = Column(String(100), nullable=False, index=True)  # Purchase order number, etc.
    entry_type = Column(SQLEnum(InventoryTransactionType), nullable=False, index=True)
    entry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    notes = Column(Text)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    store = relationship("Store", back_populates="inventory_entries")
    vendor = relationship("Vendor", back_populates="inventory_entries")
    created_by_user = relationship("User")
    transactions = relationship("InventoryTransaction", back_populates="entry", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<InventoryEntry(id={self.id}, entry_number='{self.entry_number}', entry_type='{self.entry_type}')>"


class InventoryTransaction(Base):
    """Inventory transaction model for individual line items."""
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("inventory_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    quantity = Column(Numeric(10, 4), nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="SET NULL"), nullable=True)
    unit_cost = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text)

    # Relationships
    entry = relationship("InventoryEntry", back_populates="transactions")
    material = relationship("Material")
    product = relationship("Product")
    unit_of_measure = relationship("UnitOfMeasure")

    def __repr__(self):
        return f"<InventoryTransaction(id={self.id}, entry_id={self.entry_id}, quantity={self.quantity})>"

