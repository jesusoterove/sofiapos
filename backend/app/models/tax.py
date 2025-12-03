"""
Tax models for product taxation.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Tax(Base):
    """Tax model for tax rates."""
    __tablename__ = "taxes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    rate = Column(Numeric(5, 4), nullable=False)  # e.g., 0.16 for 16%
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product_taxes = relationship("ProductTax", back_populates="tax", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tax(id={self.id}, name='{self.name}', rate={self.rate})>"


class ProductTax(Base):
    """Association table for product taxes."""
    __tablename__ = "product_taxes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    tax_id = Column(Integer, ForeignKey("taxes.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="taxes")
    tax = relationship("Tax", back_populates="product_taxes")

    def __repr__(self):
        return f"<ProductTax(product_id={self.product_id}, tax_id={self.tax_id})>"

