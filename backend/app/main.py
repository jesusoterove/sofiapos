"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from app.database import engine, Base
from app.hooks import loader  # Load custom hooks on startup
from app.scripts.create_default_admin import ensure_default_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Starting SofiaPOS API...")
    try:
        # Load hooks
        loader.load_hooks()
        # Create database tables (if needed)
        # Base.metadata.create_all(bind=engine)
        # Ensure default admin user exists
        # Wrap in try-except to prevent startup failure if admin creation fails
        try:
            ensure_default_admin()
        except Exception as e:
            print(f"⚠ Warning: Could not ensure default admin user: {e}")
            print("⚠ Application will continue, but admin user may not exist")
            import traceback
            traceback.print_exc()
    except Exception as e:
        print(f"✗ Error during startup: {e}")
        import traceback
        traceback.print_exc()
        # Don't raise - let the app start even if some initialization fails
        # This prevents 503 errors during startup
    
    yield
    
    # Shutdown
    print("Shutting down SofiaPOS API...")


# Create FastAPI application
app = FastAPI(
    title="SofiaPOS API",
    description="Point of Sale and Restaurant Management System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
# When allow_credentials=True, you cannot use allow_origins=["*"]
# Must specify exact origins
allowed_origins = [
    "http://localhost:3000",  # Console app (local dev)
    "http://localhost:3001",  # Console app (Docker)
    "http://localhost:5173",  # POS app (Vite default)
    "http://localhost:5174",  # POS app (alternative port)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# Add environment-specific origins if set
import os
if os.getenv("CORS_ORIGINS"):
    allowed_origins.extend(os.getenv("CORS_ORIGINS").split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return JSONResponse({
        "message": "SofiaPOS API",
        "version": "1.0.0",
        "status": "running"
    })


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        from app.database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        finally:
            db.close()
        
        return JSONResponse({
            "status": "healthy",
            "database": db_status
        })
    except Exception as e:
        return JSONResponse(
            {"status": "unhealthy", "error": str(e)},
            status_code=503
        )


# Mount static files for uploaded images BEFORE routers
# This ensures static files are served before API routes are checked
# Static files are served without authentication by default in FastAPI
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# # Ensure product_images subdirectory exists
# product_images_dir = uploads_dir / "product_images"
# product_images_dir.mkdir(parents=True, exist_ok=True)
# tiles_dir = product_images_dir / "tiles_110_110"
# tiles_dir.mkdir(parents=True, exist_ok=True)

# Mount static files - StaticFiles mounts bypass authentication by default
# Mount BEFORE routers to ensure static files are checked first
try:
    # Use absolute path to avoid issues with working directory
    abs_uploads_dir = uploads_dir.resolve()
    
    # Mount static files directly - this serves files without authentication
    # FastAPI's StaticFiles doesn't use dependencies, so it bypasses OAuth2PasswordBearer
    app.mount("/uploads", StaticFiles(directory=str(abs_uploads_dir), html=False), name="uploads")
    print(f"✓ Static files mounted at /uploads from {abs_uploads_dir}")
except Exception as e:
    print(f"⚠ Warning: Could not mount static files directory: {e}")
    import traceback
    traceback.print_exc()

# Import and include routers AFTER static files mount
from app.api.v1 import router as api_v1_router
app.include_router(api_v1_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

