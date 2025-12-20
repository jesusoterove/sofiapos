"""
API v1 routes.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["v1"])

# Import and include route modules
from app.api.v1 import (
    auth, stores, users, materials, products, unit_of_measures, settings,
    store_product_groups, kit_components, store_product_prices, shifts, cash_registers, sales, tables, inventory_control,
    product_categories, document_prefixes, orders, recipes, product_unit_of_measures, material_unit_of_measures
)
router.include_router(auth.router)
router.include_router(stores.router)
router.include_router(users.router)
router.include_router(materials.router)
router.include_router(products.router)
router.include_router(unit_of_measures.router)
router.include_router(settings.router)
router.include_router(store_product_groups.router)
router.include_router(kit_components.router)
router.include_router(store_product_prices.router)
router.include_router(shifts.router)
router.include_router(cash_registers.router)
router.include_router(sales.router)
router.include_router(tables.router)
router.include_router(inventory_control.router)
router.include_router(product_categories.router)
router.include_router(document_prefixes.router)
router.include_router(orders.router)
router.include_router(recipes.router)
router.include_router(product_unit_of_measures.router)
router.include_router(material_unit_of_measures.router)

