"""
Table management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Table
from app.schemas.table import TableCreate, TableUpdate, TableResponse
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("", response_model=List[TableResponse])
async def list_tables(
    store_id: Optional[int] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all tables."""
    query = db.query(Table)
    
    if store_id is not None:
        query = query.filter(Table.store_id == store_id)
    
    if active_only:
        query = query.filter(Table.is_active == True)
    
    tables = query.order_by(Table.table_number).all()
    return tables


@router.get("/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a table by ID."""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table

