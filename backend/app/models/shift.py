"""
Shift models for shift management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

