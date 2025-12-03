"""
Discount models for product discounts.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ProductDiscount(Base):
    """Product discount model."""
    __tablename__ = "product_discounts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    discount_type = Column(String(20), nullable=False)  # "percentage" or "fixed"
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_quantity = Column(Numeric(10, 4), nullable=True)  # Minimum quantity to apply discount
    effective_from = Column(DateTime(timezone=True), server_default=func.now())
    effective_to = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="discounts")

    def __repr__(self):
        return f"<ProductDiscount(id={self.id}, product_id={self.product_id}, discount_type='{self.discount_type}')>"

