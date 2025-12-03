"""
Payment models for payment management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PaymentMethodType(str, enum.Enum):
    """Payment method types."""
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"


class PaymentMethod(Base):
    """Payment method configuration."""
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    type = Column(SQLEnum(PaymentMethodType), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    requires_confirmation = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    payments = relationship("Payment", back_populates="payment_method")

    def __repr__(self):
        return f"<PaymentMethod(id={self.id}, name='{self.name}', type='{self.type}')>"


class Payment(Base):
    """Payment model for order payments."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    reference_number = Column(String(100), nullable=True)  # Transaction reference
    notes = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    payment_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="payments")
    payment_method = relationship("PaymentMethod", back_populates="payments")
    user = relationship("User", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, order_id={self.order_id}, amount={self.amount})>"

