"""
Order management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Any
from datetime import datetime

from app.database import get_db
from app.models import Order, OrderItem, Store, Shift, CashRegister, Table, Customer, User, Product
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderItemCreate, OrderItemResponse
)
from app.api.v1.auth import get_current_user
from app.utils.document_numbers import generate_order_number
from app.utils.base36 import encode_base36

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: Union[OrderCreate, dict] = Body(...),  # Accept both Pydantic model and dict
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new order.
    Accepts order_number if provided, otherwise generates one.
    Handles both Pydantic schema (from frontend) and dict (from sync).
    """
    # Parse order_data - handle both dict (from sync) and Pydantic model
    if isinstance(order_data, dict):
        # Handle dict from sync (flexible field names)
        store_id = order_data.get('store_id')
        order_number = order_data.get('order_number')
        status = order_data.get('status')
        subtotal = order_data.get('subtotal', 0)
        tax_amount = order_data.get('tax_amount') or order_data.get('taxes', 0)
        discount_amount = order_data.get('discount_amount') or order_data.get('discount', 0)
        total = order_data.get('total', 0)
        shift_id = order_data.get('shift_id')
        cash_register_id = order_data.get('cash_register_id')
        table_id = order_data.get('table_id')
        customer_id = order_data.get('customer_id')
        notes = order_data.get('notes')
        items = order_data.get('items', [])
    else:
        # Handle Pydantic model
        store_id = order_data.store_id
        order_number = order_data.order_number
        status = order_data.status
        subtotal = order_data.subtotal
        tax_amount = order_data.tax_amount if order_data.tax_amount is not None else (order_data.taxes or 0)
        discount_amount = order_data.discount_amount if order_data.discount_amount is not None else (order_data.discount or 0)
        total = order_data.total
        shift_id = order_data.shift_id
        cash_register_id = order_data.cash_register_id
        table_id = order_data.table_id
        customer_id = order_data.customer_id
        notes = order_data.notes
        items = order_data.items or []
    
    # Verify store exists
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store with ID {store_id} not found"
        )
    
    # Check if user has access to this store
    if not current_user.is_superuser and current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this store"
        )
    
    # If shift_id not provided, try to find open shift for the store
    if not shift_id:
        # Find open shift for this store (through cash register)
        # For now, we'll leave it as None if not provided
        pass
    
    # If cash_register_id not provided, try to infer from shift or leave as None
    if not cash_register_id and shift_id:
        # Try to get cash register from shift's cash register history
        from app.models import CashRegisterHistory
        cash_register_history = db.query(CashRegisterHistory).filter(
            CashRegisterHistory.shift_id == shift_id,
            CashRegisterHistory.status == 'open'
        ).first()
        if cash_register_history:
            cash_register_id = cash_register_history.cash_register_id
    
    # Verify shift if provided
    if shift_id:
        shift = db.query(Shift).filter(Shift.id == shift_id).first()
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shift with ID {shift_id} not found"
            )
        if shift.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift does not belong to the specified store"
            )
    
    # Verify cash register if provided
    if cash_register_id:
        cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
        if not cash_register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cash register with ID {cash_register_id} not found"
            )
        if cash_register.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cash register does not belong to the specified store"
            )
    
    # Verify table if provided
    if table_id:
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table with ID {table_id} not found"
            )
        if table.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table does not belong to the specified store"
            )
    
    # Verify customer if provided
    if customer_id:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer with ID {customer_id} not found"
            )
    
    # Use provided order_number if available, otherwise generate one
    if order_number:
        # Verify order number doesn't already exist
        existing_order = db.query(Order).filter(Order.order_number == order_number).first()
        if existing_order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order number '{order_number}' already exists"
            )
    else:
        # Generate order number
        # Get cash register code for order number generation
        cash_register_code = None
        if cash_register_id:
            cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
            if cash_register:
                cash_register_code = cash_register.code
        
        if not cash_register_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cash register ID is required to generate order number"
            )
        
        order_number = generate_order_number(
            db,
            cash_register_id,
            cash_register_code,
            store_id
        )
    
    # Create new order
    new_order = Order(
        store_id=store_id,
        shift_id=shift_id,
        cash_register_id=cash_register_id,
        table_id=table_id,
        customer_id=customer_id,
        user_id=current_user.id,
        order_number=order_number,
        status=status,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total=total,
        notes=notes,
    )
    
    # Set paid_at if status is paid
    if status == 'paid':
        new_order.paid_at = datetime.now()
    
    db.add(new_order)
    db.flush()  # Flush to get the ID
    
    # Create order items
    if items:
        for item_data in items:
            # Handle both dict and Pydantic model for items
            if isinstance(item_data, dict):
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity', 0)
                unit_of_measure_id = item_data.get('unit_of_measure_id')
                unit_price = item_data.get('unit_price', 0)
                discount_amount = item_data.get('discount_amount', 0)
                tax_amount = item_data.get('tax_amount', 0)
                total = item_data.get('total', 0)
                notes = item_data.get('notes')
                display_order = item_data.get('display_order', 0)
            else:
                product_id = item_data.product_id
                quantity = item_data.quantity
                unit_of_measure_id = item_data.unit_of_measure_id
                unit_price = item_data.unit_price
                discount_amount = item_data.discount_amount
                tax_amount = item_data.tax_amount
                total = item_data.total
                notes = item_data.notes
                display_order = item_data.display_order
            
            # Verify product exists
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {product_id} not found"
                )
            
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product_id,
                quantity=quantity,
                unit_of_measure_id=unit_of_measure_id,
                unit_price=unit_price,
                discount_amount=discount_amount,
                tax_amount=tax_amount,
                total=total,
                notes=notes,
                display_order=display_order,
            )
            db.add(order_item)
    
    db.commit()
    db.refresh(new_order)
    
    return new_order


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    store_id: Optional[int] = None,
    status: Optional[str] = None,
    shift_id: Optional[int] = None,
    table_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List orders with optional filtering.
    """
    query = db.query(Order)
    
    # Filter by store
    if store_id:
        # Check access
        if not current_user.is_superuser and current_user.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this store"
            )
        query = query.filter(Order.store_id == store_id)
    elif not current_user.is_superuser:
        # Non-superusers can only see their store's orders
        if current_user.store_id:
            query = query.filter(Order.store_id == current_user.store_id)
        else:
            return []
    
    # Filter by status
    if status:
        query = query.filter(Order.status == status)
    
    # Filter by shift
    if shift_id:
        query = query.filter(Order.shift_id == shift_id)
    
    # Filter by table
    if table_id:
        query = query.filter(Order.table_id == table_id)
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific order by ID.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != order.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this order"
        )
    
    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != order.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this order"
        )
    
    # Update fields
    if order_update.status is not None:
        order.status = order_update.status
        # Set paid_at if status changes to paid
        if order_update.status == 'paid' and not order.paid_at:
            order.paid_at = datetime.now()
    
    if order_update.subtotal is not None:
        order.subtotal = order_update.subtotal
    if order_update.tax_amount is not None:
        order.tax_amount = order_update.tax_amount
    if order_update.discount_amount is not None:
        order.discount_amount = order_update.discount_amount
    if order_update.total is not None:
        order.total = order_update.total
    if order_update.notes is not None:
        order.notes = order_update.notes
    if order_update.table_id is not None:
        # Verify table if provided
        if order_update.table_id:
            table = db.query(Table).filter(Table.id == order_update.table_id).first()
            if not table:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Table with ID {order_update.table_id} not found"
                )
            if table.store_id != order.store_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Table does not belong to the order's store"
                )
        order.table_id = order_update.table_id
    if order_update.customer_id is not None:
        # Verify customer if provided
        if order_update.customer_id:
            customer = db.query(Customer).filter(Customer.id == order_update.customer_id).first()
            if not customer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Customer with ID {order_update.customer_id} not found"
                )
        order.customer_id = order_update.customer_id
    
    db.commit()
    db.refresh(order)
    
    return order


@router.post("/order-items", response_model=OrderItemResponse, status_code=status.HTTP_201_CREATED)
async def create_order_item(
    item_data: dict,  # Accept dict to handle flexible field names from sync
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create an order item for an existing order.
    Accepts order_id in the request body (from sync).
    Handles both camelCase (from frontend) and snake_case field names.
    """
    # Extract order_id from body (sync sends it this way)
    # Handle both string and int order_id (frontend may send string)
    order_id_raw = item_data.get('order_id')
    if not order_id_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="order_id is required"
        )
    
    # Convert to int if string
    order_id = int(order_id_raw) if isinstance(order_id_raw, str) else order_id_raw
    
    # Verify order exists
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != order.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this order"
        )
    
    # Extract product_id
    product_id = item_data.get('product_id')
    if not product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="product_id is required"
        )
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Create order item (handle flexible field names from sync)
    # Frontend sends: product_id, quantity, unit_price, tax_rate, total, tax_amount
    # Model expects: product_id, quantity, unit_of_measure_id, unit_price, discount_amount, tax_amount, total, notes, display_order
    order_item = OrderItem(
        order_id=order_id,
        product_id=product_id,
        quantity=item_data.get('quantity', 0),
        unit_of_measure_id=item_data.get('unit_of_measure_id'),
        unit_price=item_data.get('unit_price', 0),
        discount_amount=item_data.get('discount_amount', 0),
        tax_amount=item_data.get('tax_amount', 0) or item_data.get('taxAmount', 0),
        total=item_data.get('total', 0),
        notes=item_data.get('notes'),
        display_order=item_data.get('display_order', 0),
    )
    
    db.add(order_item)
    db.commit()
    db.refresh(order_item)
    
    return order_item

