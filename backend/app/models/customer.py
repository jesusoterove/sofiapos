"""
Customer model for customer management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    """Customer model for customer management."""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(100), unique=True, nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    address = Column(Text)
    tax_id = Column(String(100))  # Tax identification number
    credit_limit = Column(Numeric(10, 2), default=0.0, nullable=False)
    notes = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="customer")

    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}', code='{self.code}')>"

