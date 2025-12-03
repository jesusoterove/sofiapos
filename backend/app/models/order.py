"""
Order models for sales and order management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class OrderStatus(str, enum.Enum):
    """Order status."""
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    CANCELLED = "cancelled"


class Order(Base):
    """Order model for sales orders."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True, index=True)
    cash_register_id = Column(Integer, ForeignKey("cash_registers.id", ondelete="SET NULL"), nullable=True)
    table_id = Column(Integer, ForeignKey("tables.id", ondelete="SET NULL"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    order_number = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.DRAFT, index=True)
    subtotal = Column(Numeric(10, 2), nullable=False, default=0.0)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    total = Column(Numeric(10, 2), nullable=False, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    store = relationship("Store", back_populates="orders")
    shift = relationship("Shift", back_populates="orders")
    cash_register = relationship("CashRegister", back_populates="orders")
    table = relationship("Table", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, order_number='{self.order_number}', status='{self.status}')>"


class OrderItem(Base):
    """Order item model for individual order line items."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(10, 4), nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="SET NULL"), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    total = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text)
    display_order = Column(Integer, default=0, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    unit_of_measure = relationship("UnitOfMeasure")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity})>"

