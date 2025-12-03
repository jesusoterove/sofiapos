"""
User, Role, and Permission models for authentication and authorization.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Association table for many-to-many relationship between users and roles
user_role_table = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for many-to-many relationship between roles and permissions
role_permission_table = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    """User model for authentication and user management."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    store = relationship("Store", back_populates="users")
    roles = relationship("Role", secondary=user_role_table, back_populates="users")
    shifts = relationship("ShiftUser", back_populates="user")
    orders = relationship("Order", back_populates="user")
    payments = relationship("Payment", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class Role(Base):
    """Role model for grouping permissions."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", secondary=user_role_table, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permission_table, back_populates="roles")

    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"


class Permission(Base):
    """Permission model for fine-grained access control."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g., "products.create", "orders.view"
    description = Column(Text)
    resource = Column(String(100), nullable=False, index=True)  # e.g., "products", "orders", "inventory"
    action = Column(String(50), nullable=False)  # e.g., "create", "read", "update", "delete"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    roles = relationship("Role", secondary=role_permission_table, back_populates="permissions")

    def __repr__(self):
        return f"<Permission(id={self.id}, name='{self.name}', code='{self.code}')>"

