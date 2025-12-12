"""
Cash register API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import User, Role, Store, CashRegister
from app.schemas.cashier import (
    CashierRegisterRequest, CashierResponse, CashRegisterResponse, CashierUserCreateRequest
)
from app.schemas.user import RoleInfo, StoreInfo
from app.api.v1.auth import get_current_user, create_access_token, SECRET_KEY, ALGORITHM
from app.services.auth_service import get_password_hash
from datetime import timedelta
from jose import JWTError, jwt
from pydantic import BaseModel

router = APIRouter(prefix="/cash_registers", tags=["cash_registers"])


def get_or_create_cashier_role(db: Session) -> Role:
    """
    Get or create the Cashier role.
    Returns the Cashier role.
    """
    cashier_role = db.query(Role).filter(Role.name == "Cashier").first()
    
    if not cashier_role:
        # Create Cashier role if it doesn't exist
        cashier_role = Role(
            name="Cashier",
            description="Cashier role for POS terminals"
        )
        db.add(cashier_role)
        db.commit()
        db.refresh(cashier_role)
    
    return cashier_role


@router.post("/register", response_model=CashRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_cash_register(
    cashier_data: CashierRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new cash register terminal.
    Creates a cash register for the terminal. User creation is optional and done separately.
    """
    # Verify store exists
    store = db.query(Store).filter(Store.id == cashier_data.store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store with ID {cashier_data.store_id} not found"
        )
    
    # Check if user has access to this store (admin/superuser only)
    if not current_user.is_superuser and current_user.store_id != cashier_data.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to register cash registers for this store"
        )
    
    # Check if cash register with this registration code already exists
    # Use full registration code (database column allows up to 50 chars, "CR-" prefix is 3 chars)
    # So we can use up to 47 chars from registration_code, but we'll use the full code
    cash_register_code = f"CR-{cashier_data.registration_code.upper()}"
    existing_cr = db.query(CashRegister).filter(CashRegister.code == cash_register_code).first()
    
    if existing_cr:
        # Update existing cash register
        existing_cr.store_id = cashier_data.store_id
        existing_cr.name = cashier_data.name
        existing_cr.is_active = True  # Ensure it's active
        db.commit()
        db.refresh(existing_cr)
        cash_register = existing_cr
    else:
        # Create new cash register
        cash_register = CashRegister(
            store_id=cashier_data.store_id,
            name=cashier_data.name,
            code=cash_register_code,
            is_active=True
        )
        db.add(cash_register)
        db.commit()
        db.refresh(cash_register)
    
    # Generate registration token (long-lived token for this cash register)
    # Token contains: cash_register_id, registration_code, store_id
    registration_token_data = {
        "cash_register_id": cash_register.id,
        "registration_code": cashier_data.registration_code,
        "store_id": cash_register.store_id,
        "type": "registration"
    }
    # Long-lived token (1 year expiry)
    registration_token = create_access_token(
        data=registration_token_data,
        expires_delta=timedelta(days=365)
    )
    
    return CashRegisterResponse(
        id=cash_register.id,
        store_id=cash_register.store_id,
        name=cash_register.name,
        code=cash_register.code,
        is_active=cash_register.is_active,
        registration_code=cashier_data.registration_code,
        registration_token=registration_token,
        created_at=cash_register.created_at
    )


@router.post("/{cash_register_id}/user", response_model=CashierResponse, status_code=status.HTTP_201_CREATED)
async def create_cash_register_user(
    cash_register_id: int,
    user_data: CashierUserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a user for a cash register with Cashier role and store permissions.
    """
    # Verify cash register exists
    cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
    if not cash_register:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register with ID {cash_register_id} not found"
        )
    
    # Verify cash_register_id matches the request
    if user_data.cash_register_id != cash_register_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cash register ID mismatch"
        )
    
    # Check if user has access to this store (admin/superuser only)
    if not current_user.is_superuser and current_user.store_id != cash_register.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create users for this cash register"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with username '{user_data.username}' already exists"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{user_data.email}' already exists"
        )
    
    # Get or create Cashier role
    cashier_role = get_or_create_cashier_role(db)
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    
    cashier_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        store_id=cash_register.store_id,
        is_active=True,
        is_superuser=False
    )
    
    # Assign Cashier role
    cashier_user.roles = [cashier_role]
    
    db.add(cashier_user)
    db.commit()
    db.refresh(cashier_user)
    
    # Reload with relationships
    from sqlalchemy.orm import joinedload
    cashier_user = db.query(User).options(
        joinedload(User.roles),
        joinedload(User.store)
    ).filter(User.id == cashier_user.id).first()
    
    # Build response
    roles_list = [RoleInfo(id=role.id, name=role.name, description=role.description) for role in cashier_user.roles]
    
    store_info = None
    if cashier_user.store:
        store_info = StoreInfo(id=cashier_user.store.id, name=cashier_user.store.name, code=cashier_user.store.code)
    
    # Extract registration code from cash register code (CR-XXXXXXXX -> XXXXXXXX)
    registration_code = cash_register.code.replace("CR-", "") if cash_register.code.startswith("CR-") else None
    
    return CashierResponse(
        id=cashier_user.id,
        username=cashier_user.username,
        email=cashier_user.email,
        full_name=cashier_user.full_name,
        phone=cashier_user.phone,
        store_id=cashier_user.store_id,
        is_active=cashier_user.is_active,
        is_superuser=cashier_user.is_superuser,
        role_ids=[role.id for role in cashier_user.roles],
        created_at=cashier_user.created_at,
        updated_at=cashier_user.updated_at,
        last_login=cashier_user.last_login,
        roles=roles_list,
        store=store_info,
        registration_code=registration_code,
        cash_register_id=cash_register.id,
        cash_register_code=cash_register.code
    )


@router.get("/{cash_register_id}", response_model=CashRegisterResponse)
async def get_cash_register(
    cash_register_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single cash register by ID.
    """
    cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
    if not cash_register:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register with ID {cash_register_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != cash_register.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this cash register"
        )
    
    # Extract registration code from code (CR-XXXXXXXX -> XXXXXXXX)
    registration_code = cash_register.code.replace("CR-", "") if cash_register.code.startswith("CR-") else cash_register.code
    
    return CashRegisterResponse(
        id=cash_register.id,
        store_id=cash_register.store_id,
        name=cash_register.name,
        code=cash_register.code,
        is_active=cash_register.is_active,
        registration_code=registration_code,
        registration_token="",  # Not returned for security
        created_at=cash_register.created_at
    )


@router.get("/list", response_model=List[CashRegisterResponse])
async def list_cash_registers(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all cash registers.
    """
    query = db.query(CashRegister).filter(CashRegister.is_active == True)
    
    # Filter by store if provided
    if store_id is not None:
        # Check access
        if not current_user.is_superuser and current_user.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this store"
            )
        query = query.filter(CashRegister.store_id == store_id)
    elif not current_user.is_superuser:
        # Non-superusers can only see their store's cash registers
        if current_user.store_id:
            query = query.filter(CashRegister.store_id == current_user.store_id)
        else:
            return []
    
    cash_registers = query.order_by(CashRegister.name).all()
    
    result = []
    for cr in cash_registers:
        # Extract registration code from code (CR-XXXXXXXX -> XXXXXXXX)
        registration_code = cr.code.replace("CR-", "") if cr.code.startswith("CR-") else cr.code
        
        # Note: registration_token is not included in list responses for security
        # Only returned during initial registration
        result.append(CashRegisterResponse(
            id=cr.id,
            store_id=cr.store_id,
            name=cr.name,
            code=cr.code,
            is_active=cr.is_active,
            registration_code=registration_code,
            registration_token="",  # Not returned in list for security
            created_at=cr.created_at
        ))
    
    return result


@router.get("", response_model=List[CashierResponse])
async def list_cashiers(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all cashiers (users with Cashier role) with their associated cash registers.
    """
    # Get Cashier role
    cashier_role = db.query(Role).filter(Role.name == "Cashier").first()
    if not cashier_role:
        return []
    
    # Query users with Cashier role
    from sqlalchemy.orm import joinedload
    query = db.query(User).join(User.roles).filter(Role.id == cashier_role.id)
    
    # Filter by store if provided
    if store_id is not None:
        # Check access
        if not current_user.is_superuser and current_user.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this store"
            )
        query = query.filter(User.store_id == store_id)
    elif not current_user.is_superuser:
        # Non-superusers can only see their store's cashiers
        if current_user.store_id:
            query = query.filter(User.store_id == current_user.store_id)
        else:
            return []
    
    # Only active cashiers
    query = query.filter(User.is_active == True)
    
    cashiers = query.options(
        joinedload(User.roles),
        joinedload(User.store)
    ).all()
    
    # Build response list
    result = []
    for cashier in cashiers:
        roles_list = [RoleInfo(id=role.id, name=role.name, description=role.description) for role in cashier.roles]
        
        store_info = None
        if cashier.store:
            store_info = StoreInfo(id=cashier.store.id, name=cashier.store.name, code=cashier.store.code)
        
        # Extract registration code from username (cashier_XXXXX)
        registration_code = None
        if cashier.username.startswith("cashier_"):
            registration_code = cashier.username.replace("cashier_", "")
        
        # Find associated cash register by code pattern
        cash_register = None
        if registration_code:
            # Use full registration code to find the cash register
            cash_register_code = f"CR-{registration_code.upper()}"
            cash_register = db.query(CashRegister).filter(CashRegister.code == cash_register_code).first()
        
        result.append(CashierResponse(
            id=cashier.id,
            username=cashier.username,
            email=cashier.email,
            full_name=cashier.full_name,
            phone=cashier.phone,
            store_id=cashier.store_id,
            is_active=cashier.is_active,
            is_superuser=cashier.is_superuser,
            role_ids=[role.id for role in cashier.roles],
            created_at=cashier.created_at,
            updated_at=cashier.updated_at,
            last_login=cashier.last_login,
            roles=roles_list,
            store=store_info,
            registration_code=registration_code,
            cash_register_id=cash_register.id if cash_register else None,
            cash_register_code=cash_register.code if cash_register else None
        ))
    
    return result

