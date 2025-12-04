"""
Database configuration and session management.
Supports both PostgreSQL and MySQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional

# Try to find .env file in backend directory or project root (optional)
# Environment variables from Docker/system will work even without .env file
backend_dir = Path(__file__).parent.parent
project_root = backend_dir.parent
env_file = None
for potential_env in [backend_dir / ".env", project_root / ".env"]:
    if potential_env.exists():
        env_file = potential_env
        break

class DatabaseSettings(BaseSettings):
    """Database configuration settings.
    
    Reads from environment variables (prefixed with DB_):
    - DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    
    Also optionally reads from .env file if it exists.
    Environment variables take precedence over .env file values.
    
    Works perfectly with Docker Compose environment variables even without .env file.
    Pydantic Settings automatically reads from system environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=str(env_file) if env_file else None,  # Optional .env file
        env_file_encoding="utf-8",
        env_prefix="DB_",  # Looks for DB_TYPE, DB_HOST, etc. in environment
        case_sensitive=False,
        extra="ignore",  # Ignore extra environment variables
    )
    
    # Field names without 'db_' prefix so with env_prefix="DB_" they match DB_TYPE, DB_HOST, etc.
    type: str = "postgresql"  # postgresql or mysql
    host: str = "localhost"
    port: int = 5432
    user: str = "postgres"
    password: str = ""
    name: str = "sofiapos"
    
    @property
    def db_type(self) -> str:
        """Alias for type."""
        return self.type
    
    @property
    def db_host(self) -> str:
        """Alias for host."""
        return self.host
    
    @property
    def db_port(self) -> int:
        """Alias for port."""
        return self.port
    
    @property
    def db_user(self) -> str:
        """Alias for user."""
        return self.user
    
    @property
    def db_password(self) -> str:
        """Alias for password."""
        return self.password
    
    @property
    def db_name(self) -> str:
        """Alias for name."""
        return self.name

# Load database settings
db_settings = DatabaseSettings()

# Debug: Print loaded settings (without password)
import os
print(f"Database Settings:")
print(f"  DB_TYPE from env: {os.getenv('DB_TYPE', 'NOT SET')}")
print(f"  DB_HOST from env: {os.getenv('DB_HOST', 'NOT SET')}")
print(f"  DB_USER from env: {os.getenv('DB_USER', 'NOT SET')}")
print(f"  DB_NAME from env: {os.getenv('DB_NAME', 'NOT SET')}")
print(f"  Loaded db_type: {db_settings.db_type}")
print(f"  Loaded db_host: {db_settings.db_host}")
print(f"  Loaded db_user: {db_settings.db_user}")
print(f"  Loaded db_name: {db_settings.db_name}")

# Construct database URL
if db_settings.db_type == "postgresql":
    # Use psycopg2 driver explicitly
    database_url = f"postgresql+psycopg2://{db_settings.db_user}:{db_settings.db_password}@{db_settings.db_host}:{db_settings.db_port}/{db_settings.db_name}"
elif db_settings.db_type == "mysql":
    database_url = f"mysql+pymysql://{db_settings.db_user}:{db_settings.db_password}@{db_settings.db_host}:{db_settings.db_port}/{db_settings.db_name}"
else:
    raise ValueError(f"Unsupported database type: {db_settings.db_type}")
print(database_url)
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

