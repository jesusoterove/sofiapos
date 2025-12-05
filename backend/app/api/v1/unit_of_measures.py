"""
Unit of Measure API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import UnitOfMeasure
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/unit-of-measures", tags=["unit-of-measures"])


@router.get("")
async def list_unit_of_measures(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all unit of measures."""
    query = db.query(UnitOfMeasure)
    if active_only:
        query = query.filter(UnitOfMeasure.is_active == True)
    units = query.order_by(UnitOfMeasure.name).all()
    return [
        {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "type": unit.type,
            "is_active": unit.is_active,
        }
        for unit in units
    ]

