"""
Database configuration and session management.
Supports both PostgreSQL and MySQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings
from typing import Optional

class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    db_type: str = "postgresql"  # postgresql or mysql
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = ""
    db_name: str = "sofiapos"
    
    class Config:
        env_file = ".env"
        env_prefix = "DB_"

# Load database settings
db_settings = DatabaseSettings()

# Construct database URL
if db_settings.db_type == "postgresql":
    database_url = f"postgresql://{db_settings.db_user}:{db_settings.db_password}@{db_settings.db_host}:{db_settings.db_port}/{db_settings.db_name}"
elif db_settings.db_type == "mysql":
    database_url = f"mysql+pymysql://{db_settings.db_user}:{db_settings.db_password}@{db_settings.db_host}:{db_settings.db_port}/{db_settings.db_name}"
else:
    raise ValueError(f"Unsupported database type: {db_settings.db_type}")

# Create engine with connection pooling
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

