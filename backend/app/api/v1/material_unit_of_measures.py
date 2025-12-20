"""
Material Unit of Measure API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import MaterialUnitOfMeasure
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/material-unit-of-measures", tags=["material-unit-of-measures"])


@router.get("")
async def list_material_unit_of_measures(
    material_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all material unit of measures, optionally filtered by material_id."""
    query = db.query(MaterialUnitOfMeasure)
    
    if material_id is not None:
        query = query.filter(MaterialUnitOfMeasure.material_id == material_id)
    
    units = query.order_by(MaterialUnitOfMeasure.display_order).all()
    return [
        {
            "id": unit.id,
            "material_id": unit.material_id,
            "unit_of_measure_id": unit.unit_of_measure_id,
            "conversion_factor": float(unit.conversion_factor),
            "is_base_unit": unit.is_base_unit,
            "display_order": unit.display_order,
        }
        for unit in units
    ]

