"""
API v1 routes.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["v1"])

# Import and include route modules
from app.api.v1 import auth, stores, users
router.include_router(auth.router)
router.include_router(stores.router)
router.include_router(users.router)
# router.include_router(products.router, prefix="/products", tags=["products"])
# router.include_router(orders.router, prefix="/orders", tags=["orders"])

