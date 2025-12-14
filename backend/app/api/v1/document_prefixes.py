"""
Document prefix management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import DocumentPrefix, Store
from app.schemas.document_prefix import (
    DocumentPrefixCreate, DocumentPrefixUpdate, DocumentPrefixResponse
)
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/document_prefixes", tags=["document_prefixes"])


@router.get("", response_model=List[DocumentPrefixResponse])
async def list_document_prefixes(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List document prefixes.
    If store_id is provided, returns store-specific prefixes.
    Otherwise returns global defaults.
    """
    query = db.query(DocumentPrefix).filter(DocumentPrefix.is_active == True)
    
    if store_id is not None:
        # Get store-specific prefixes, fallback to global (store_id is NULL)
        query = query.filter(
            (DocumentPrefix.store_id == store_id) | (DocumentPrefix.store_id.is_(None))
        )
    else:
        # Get all active prefixes
        pass
    
    prefixes = query.all()
    return prefixes


@router.get("/{prefix_id}", response_model=DocumentPrefixResponse)
async def get_document_prefix(
    prefix_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a single document prefix by ID."""
    prefix = db.query(DocumentPrefix).filter(DocumentPrefix.id == prefix_id).first()
    if not prefix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document prefix with ID {prefix_id} not found"
        )
    return prefix


@router.post("", response_model=DocumentPrefixResponse, status_code=status.HTTP_201_CREATED)
async def create_document_prefix(
    prefix_data: DocumentPrefixCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new document prefix."""
    # Validate doc_type
    valid_types = ['shift', 'invoice', 'inventory', 'payment']
    if prefix_data.doc_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid doc_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Check if prefix already exists for this store/doc_type combination
    existing = db.query(DocumentPrefix).filter(
        DocumentPrefix.store_id == prefix_data.store_id,
        DocumentPrefix.doc_type == prefix_data.doc_type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document prefix for doc_type '{prefix_data.doc_type}' already exists for this store"
        )
    
    # Validate prefix (alphanumeric, uppercase)
    prefix_upper = prefix_data.prefix.upper()
    if not prefix_upper.isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prefix must contain only alphanumeric characters"
        )
    
    prefix = DocumentPrefix(
        store_id=prefix_data.store_id,
        doc_type=prefix_data.doc_type,
        prefix=prefix_upper,
        is_active=prefix_data.is_active
    )
    db.add(prefix)
    db.commit()
    db.refresh(prefix)
    
    return prefix


@router.put("/{prefix_id}", response_model=DocumentPrefixResponse)
async def update_document_prefix(
    prefix_id: int,
    prefix_data: DocumentPrefixUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing document prefix."""
    prefix = db.query(DocumentPrefix).filter(DocumentPrefix.id == prefix_id).first()
    if not prefix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document prefix with ID {prefix_id} not found"
        )
    
    # Update fields
    if prefix_data.prefix is not None:
        prefix_upper = prefix_data.prefix.upper()
        if not prefix_upper.isalnum():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prefix must contain only alphanumeric characters"
            )
        prefix.prefix = prefix_upper
    
    if prefix_data.is_active is not None:
        prefix.is_active = prefix_data.is_active
    
    db.commit()
    db.refresh(prefix)
    
    return prefix


@router.delete("/{prefix_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_prefix(
    prefix_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a document prefix."""
    prefix = db.query(DocumentPrefix).filter(DocumentPrefix.id == prefix_id).first()
    if not prefix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document prefix with ID {prefix_id} not found"
        )
    
    db.delete(prefix)
    db.commit()
    
    return None

