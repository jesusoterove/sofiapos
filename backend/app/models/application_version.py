"""
Application version models for managing POS app updates.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
from sqlalchemy.sql import func
from app.database import Base


class ApplicationVersion(Base):
    """Application version model for tracking POS app releases."""
    __tablename__ = "application_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), nullable=False, index=True)  # e.g., "1.0.1"
    platform = Column(String(20), nullable=False, index=True)  # "win32", "darwin", "linux"
    release_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    release_notes = Column(Text, nullable=True)
    download_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    checksum = Column(String(64), nullable=True)  # SHA-256 checksum
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Composite indexes for efficient queries
    __table_args__ = (
        Index('idx_version_platform', 'version', 'platform'),
        Index('idx_active_platform', 'is_active', 'platform'),
        Index('idx_active_platform_release', 'is_active', 'platform', 'release_date'),
    )

    def __repr__(self):
        return f"<ApplicationVersion(id={self.id}, version='{self.version}', platform='{self.platform}')>"

