"""
Cash register models for cash register management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class CashRegisterStatus(str, enum.Enum):
    """Cash register status."""
    OPEN = "open"
    CLOSED = "closed"


class CashRegister(Base):
    """Cash register model."""
    __tablename__ = "cash_registers"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    hardware_id = Column(String(100), nullable=True, index=True, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    store = relationship("Store", back_populates="cash_registers")
    histories = relationship("CashRegisterHistory", back_populates="cash_register")
    orders = relationship("Order", back_populates="cash_register")

    def __repr__(self):
        return f"<CashRegister(id={self.id}, name='{self.name}', code='{self.code}')>"


class CashRegisterHistory(Base):
    """Cash register history for tracking open/close events."""
    __tablename__ = "cash_register_histories"

    id = Column(Integer, primary_key=True, index=True)
    cash_register_id = Column(Integer, ForeignKey("cash_registers.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    status = Column(SQLEnum(CashRegisterStatus), nullable=False, index=True)
    opening_balance = Column(Numeric(10, 2), nullable=False, default=0.0)
    closing_balance = Column(Numeric(10, 2), nullable=True)
    expected_balance = Column(Numeric(10, 2), nullable=True)
    difference = Column(Numeric(10, 2), nullable=True)  # Difference between expected and actual
    opened_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    closed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    opened_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text)

    # Relationships
    cash_register = relationship("CashRegister", back_populates="histories")
    shift = relationship("Shift")
    opened_by_user = relationship("User", foreign_keys=[opened_by_user_id])
    closed_by_user = relationship("User", foreign_keys=[closed_by_user_id])

    def __repr__(self):
        return f"<CashRegisterHistory(id={self.id}, cash_register_id={self.cash_register_id}, status='{self.status}')>"

