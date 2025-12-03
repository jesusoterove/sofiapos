"""
Setting model for application configuration.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Setting(Base):
    """Setting model for application-wide and store-specific settings."""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=True, index=True)  # NULL for global settings
    key = Column(String(255), nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(50), nullable=False, default="string")  # string, integer, float, boolean, json
    description = Column(Text)
    is_system_setting = Column(Boolean, default=False, nullable=False)  # System settings cannot be deleted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    store = relationship("Store", back_populates="settings")

    def __repr__(self):
        return f"<Setting(id={self.id}, key='{self.key}', store_id={self.store_id})>"

