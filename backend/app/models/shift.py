"""
Shift models for shift management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from app.database import Base


class ShiftStatus(str, enum.Enum):
    """Shift status."""
    OPEN = "open"
    CLOSED = "closed"


class Shift(Base):
    """Shift model for managing work shifts."""
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_number = Column(String(50), nullable=False, index=True)
    status = Column(SQLEnum(ShiftStatus), nullable=False, default=ShiftStatus.OPEN, index=True)
    opened_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    closed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    opened_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)

    # Relationships
    store = relationship("Store", back_populates="shifts")
    opened_by_user = relationship("User", foreign_keys=[opened_by_user_id])
    closed_by_user = relationship("User", foreign_keys=[closed_by_user_id])
    shift_users = relationship("ShiftUser", back_populates="shift", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="shift")
    inventory_items = relationship("ShiftInventory", back_populates="shift", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Shift(id={self.id}, shift_number='{self.shift_number}', status='{self.status}')>"


class ShiftUser(Base):
    """Association table for shift users."""
    __tablename__ = "shift_users"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    left_at = Column(DateTime(timezone=True), nullable=True)
    removed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    removal_reason = Column(Text)

    # Relationships
    shift = relationship("Shift", back_populates="shift_users")
    user = relationship("User", foreign_keys=[user_id], back_populates="shifts")
    removed_by_user = relationship("User", foreign_keys=[removed_by_user_id])

    def __repr__(self):
        return f"<ShiftUser(shift_id={self.shift_id}, user_id={self.user_id})>"


class ShiftInventory(Base):
    """Shift inventory entry model."""
    __tablename__ = "shift_inventory"

    rec_id = Column(Integer, primary_key=True, autoincrement=True, name="rec_id")
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, name="shift_id")
    entry_type = Column(String(10), nullable=False, name="entry_type")  # 'beg_bal', 'refill', 'end_bal'
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, name="product_id")
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=True, name="material_id")
    uofm_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="SET NULL"), nullable=False, name="uofm_id")
    quantity = Column(Numeric(19, 2), nullable=False, name="quantity")
    created_dt = Column(DateTime, nullable=False, default=datetime.utcnow, name="created_dt")

    # Relationships
    shift = relationship("Shift", back_populates="inventory_items")
    product = relationship("Product")
    material = relationship("Material")
    uofm = relationship("UnitOfMeasure")

    __table_args__ = (
        Index("idx_shift_inventory_shift", "shift_id"),
        Index("idx_shift_inventory_entry_type", "entry_type"),
    )

    def __repr__(self):
        return f"<ShiftInventory(rec_id={self.rec_id}, shift_id={self.shift_id}, entry_type='{self.entry_type}')>"

