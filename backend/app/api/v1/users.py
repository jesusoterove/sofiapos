"""
User management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import User, Role, Order, Payment, ShiftUser
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse,
    UserDeleteRequest, UserDeleteResponse, RoleInfo, StoreInfo
)
from app.api.v1.auth import get_current_user
from app.services.auth_service import verify_password, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


def check_user_has_transactions(db: Session, user_id: int) -> dict:
    """
    Check if user has associated transactions/data.
    
    Returns:
        dict: {
            'has_transactions': bool,
            'orders_count': int,
            'payments_count': int,
            'shifts_count': int
        }
    """
    orders_count = db.query(func.count(Order.id)).filter(Order.user_id == user_id).scalar() or 0
    payments_count = db.query(func.count(Payment.id)).filter(Payment.user_id == user_id).scalar() or 0
    shifts_count = db.query(func.count(ShiftUser.id)).filter(ShiftUser.user_id == user_id).scalar() or 0
    
    has_transactions = orders_count > 0 or payments_count > 0 or shifts_count > 0
    
    return {
        'has_transactions': has_transactions,
        'orders_count': orders_count,
        'payments_count': payments_count,
        'shifts_count': shifts_count
    }


@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users."""
    query = db.query(User)
    
    if active_only:
        query = query.filter(User.is_active == True)
    
    if store_id is not None:
        query = query.filter(User.store_id == store_id)
    
    # Eagerly load relationships
    from sqlalchemy.orm import joinedload
    users = query.options(
        joinedload(User.roles),
        joinedload(User.store)
    ).offset(skip).limit(limit).all()
    
    # Convert to response format with roles and store info
    result = []
    for user in users:
        try:
            # Build roles list
            roles_list = [RoleInfo(id=role.id, name=role.name, description=role.description) for role in user.roles]
            
            # Build store info if exists
            store_info = None
            if user.store:
                store_info = StoreInfo(id=user.store.id, name=user.store.name, code=user.store.code)
            
            # Create response using model_validate
            user_response = UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                full_name=user.full_name,
                phone=user.phone,
                store_id=user.store_id,
                is_active=user.is_active,
                is_superuser=user.is_superuser,
                role_ids=[role.id for role in user.roles],
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login,
                roles=roles_list,
                store=store_info
            )
            result.append(user_response)
        except Exception as e:
            # Log error but continue with other users
            import traceback
            print(f"Error processing user {user.id}: {e}")
            traceback.print_exc()
            continue
    
    return result


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by ID."""
    from sqlalchemy.orm import joinedload
    user = db.query(User).options(
        joinedload(User.roles),
        joinedload(User.store)
    ).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build roles list
    roles_list = [RoleInfo(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Build store info if exists
    store_info = None
    if user.store:
        store_info = StoreInfo(id=user.store.id, name=user.store.name, code=user.store.code)
    
    # Return response
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        store_id=user.store_id,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role_ids=[role.id for role in user.roles],
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login,
        roles=roles_list,
        store=store_info
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user."""
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with username '{user_data.username}' already exists"
        )
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{user_data.email}' already exists"
        )
    
    # Get roles
    roles = []
    if user_data.role_ids:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        if len(roles) != len(user_data.role_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more role IDs are invalid"
            )
    
    # Create user
    user_dict = user_data.model_dump(exclude={'password', 'role_ids'})
    user_dict['hashed_password'] = get_password_hash(user_data.password)
    user = User(**user_dict)
    
    # Assign roles
    user.roles = roles
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Reload with relationships
    from sqlalchemy.orm import joinedload
    user = db.query(User).options(
        joinedload(User.roles),
        joinedload(User.store)
    ).filter(User.id == user.id).first()
    
    # Return response
    # Build roles list
    roles_list = [RoleInfo(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Build store info if exists
    store_info = None
    if user.store:
        store_info = StoreInfo(id=user.store.id, name=user.store.name, code=user.store.code)
    
    # Return response
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        store_id=user.store_id,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role_ids=[role.id for role in user.roles],
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login,
        roles=roles_list,
        store=store_info
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if username is being changed and if new username already exists
    if user_data.username and user_data.username != user.username:
        existing = db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with username '{user_data.username}' already exists"
            )
    
    # Check if email is being changed and if new email already exists
    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{user_data.email}' already exists"
            )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True, exclude={'password', 'role_ids'})
    
    # Handle password update
    if user_data.password:
        update_data['hashed_password'] = get_password_hash(user_data.password)
    
    # Handle roles update
    if user_data.role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        if len(roles) != len(user_data.role_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more role IDs are invalid"
            )
        user.roles = roles
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    
    # Reload with relationships
    from sqlalchemy.orm import joinedload
    user = db.query(User).options(
        joinedload(User.roles),
        joinedload(User.store)
    ).filter(User.id == user.id).first()
    
    # Return response
    # Build roles list
    roles_list = [RoleInfo(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Build store info if exists
    store_info = None
    if user.store:
        store_info = StoreInfo(id=user.store.id, name=user.store.name, code=user.store.code)
    
    # Return response
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        store_id=user.store_id,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role_ids=[role.id for role in user.roles],
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login,
        roles=roles_list,
        store=store_info
    )


@router.delete("/{user_id}", response_model=UserDeleteResponse)
async def delete_user(
    user_id: int,
    delete_request: UserDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user.
    
    - If no transactions: physical deletion
    - If transactions exist and force=True with password: physical deletion
    - Otherwise: logical deletion (set is_active=False)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    # Verify password
    if not verify_password(delete_request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check for associated transactions
    transaction_info = check_user_has_transactions(db, user_id)
    
    if not transaction_info['has_transactions']:
        # No transactions - safe to delete physically
        db.delete(user)
        db.commit()
        return UserDeleteResponse(
            deleted=True,
            message="User deleted successfully",
            deleted_physically=True
        )
    
    # Has transactions
    if delete_request.force:
        # Force physical deletion with password confirmation
        db.delete(user)
        db.commit()
        return UserDeleteResponse(
            deleted=True,
            message=f"User physically deleted. Associated data removed: "
                   f"{transaction_info['orders_count']} orders, "
                   f"{transaction_info['payments_count']} payments, "
                   f"{transaction_info['shifts_count']} shifts.",
            deleted_physically=True
        )
    else:
        # Logical deletion
        user.is_active = False
        db.commit()
        return UserDeleteResponse(
            deleted=True,
            message="User deactivated (logical deletion). Associated data preserved.",
            deleted_physically=False
        )


@router.get("/{user_id}/transactions", response_model=dict)
async def get_user_transaction_info(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get information about user's associated transactions."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return check_user_has_transactions(db, user_id)


@router.get("/roles/list", response_model=List[RoleInfo])
async def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all available roles."""
    roles = db.query(Role).all()
    return [RoleInfo(id=role.id, name=role.name, description=role.description) for role in roles]

