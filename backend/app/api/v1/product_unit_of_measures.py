"""
Product Unit of Measure API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ProductUnitOfMeasure
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/product-unit-of-measures", tags=["product-unit-of-measures"])


@router.get("")
async def list_product_unit_of_measures(
    product_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all product unit of measures, optionally filtered by product_id."""
    query = db.query(ProductUnitOfMeasure)
    
    if product_id is not None:
        query = query.filter(ProductUnitOfMeasure.product_id == product_id)
    
    units = query.order_by(ProductUnitOfMeasure.display_order).all()
    return [
        {
            "id": unit.id,
            "product_id": unit.product_id,
            "unit_of_measure_id": unit.unit_of_measure_id,
            "conversion_factor": float(unit.conversion_factor),
            "is_base_unit": unit.is_base_unit,
            "display_order": unit.display_order,
        }
        for unit in units
    ]

