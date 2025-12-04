"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.hooks import loader  # Load custom hooks on startup
from app.scripts.create_default_admin import ensure_default_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Starting SofiaPOS API...")
    # Load hooks
    loader.load_hooks()
    # Create database tables (if needed)
    # Base.metadata.create_all(bind=engine)
    # Ensure default admin user exists
    ensure_default_admin()
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return JSONResponse({"status": "healthy"})


# Import and include routers
from app.api.v1 import router as api_v1_router
app.include_router(api_v1_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

