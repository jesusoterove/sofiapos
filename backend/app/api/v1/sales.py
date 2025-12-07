"""
Sales API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    Order, Payment, PaymentMethod, Store, CashRegister, Shift, ShiftUser, User,
    Customer, Table, CashRegisterHistory
)
from app.schemas.sales import (
    SalesFilterRequest, SalesResponse, SalesSummary, SalesDetail, PaymentMethodSummary
)
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/sales", tags=["sales"])


def get_date_range_for_filter_mode(
    filter_mode: str,
    cash_register_id: Optional[int],
    start_date: Optional[datetime],
    end_date: Optional[datetime],
    db: Session
) -> tuple[Optional[datetime], Optional[datetime], Optional[int], Optional[str]]:
    """
    Get start and end dates based on filter mode.
    Returns: (start_date, end_date, shift_id, cash_register_user)
    """
    now = datetime.utcnow()
    shift_id = None
    cash_register_user = None

    if filter_mode == "current_shift":
        if not cash_register_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cash register must be selected for current shift filter"
            )
        # Get current open shift for cash register
        cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
        if not cash_register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cash register with ID {cash_register_id} not found"
            )
        
        # Find open shift for the store
        shift = db.query(Shift).filter(
            Shift.store_id == cash_register.store_id,
            Shift.status == "open"
        ).first()
        
        if shift:
            shift_id = shift.id
            start_date = shift.opened_at
            end_date = now
            
            # Get user in shift
            shift_user = db.query(ShiftUser).filter(ShiftUser.shift_id == shift.id).first()
            if shift_user:
                user = db.query(User).filter(User.id == shift_user.user_id).first()
                if user:
                    cash_register_user = user.full_name or user.username
        else:
            # No open shift
            start_date = None
            end_date = None

    elif filter_mode == "last_shift":
        if not cash_register_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cash register must be selected for last shift filter"
            )
        cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
        if not cash_register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cash register with ID {cash_register_id} not found"
            )
        
        # Get last closed shift for the store
        shift = db.query(Shift).filter(
            Shift.store_id == cash_register.store_id,
            Shift.status == "closed"
        ).order_by(Shift.closed_at.desc()).first()
        
        if shift:
            shift_id = shift.id
            start_date = shift.opened_at
            end_date = shift.closed_at
            
            # Get user in shift
            shift_user = db.query(ShiftUser).filter(ShiftUser.shift_id == shift.id).first()
            if shift_user:
                user = db.query(User).filter(User.id == shift_user.user_id).first()
                if user:
                    cash_register_user = user.full_name or user.username
        else:
            start_date = None
            end_date = None

    elif filter_mode == "last_week":
        end_date = now
        start_date = now - timedelta(days=7)

    elif filter_mode == "last_month":
        end_date = now
        start_date = now - timedelta(days=30)

    elif filter_mode == "date_range":
        if not start_date or not end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date and end date are required for date range filter"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid filter mode: {filter_mode}"
        )

    return start_date, end_date, shift_id, cash_register_user


@router.post("/", response_model=SalesResponse)
async def get_sales(
    filter_data: SalesFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sales data based on filters.
    Returns paid orders with payment details.
    """
    # Get date range based on filter mode
    start_date, end_date, shift_id, cash_register_user = get_date_range_for_filter_mode(
        filter_data.filter_mode,
        filter_data.cash_register_id,
        filter_data.start_date,
        filter_data.end_date,
        db
    )

    if start_date is None and filter_data.filter_mode in ["current_shift", "last_shift"]:
        # No shift found
        return SalesResponse(
            summary=SalesSummary(
                beginning_balance=None,
                total_sales=0.0,
                payment_methods=[]
            ),
            details=[],
            start_date=None,
            end_date=None,
            cash_register_user=None
        )

    # Build query for paid orders
    query = db.query(Order).filter(Order.status == "paid")

    # Filter by store
    if filter_data.store_id:
        query = query.filter(Order.store_id == filter_data.store_id)
        # Check access
        if not current_user.is_superuser and current_user.store_id != filter_data.store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this store"
            )
    elif not current_user.is_superuser:
        # Non-superusers can only see their store's sales
        if current_user.store_id:
            query = query.filter(Order.store_id == current_user.store_id)
        else:
            return SalesResponse(
                summary=SalesSummary(
                    beginning_balance=None,
                    total_sales=0.0,
                    payment_methods=[]
                ),
                details=[],
                start_date=start_date,
                end_date=end_date,
                cash_register_user=cash_register_user
            )

    # Filter by cash register
    if filter_data.cash_register_id:
        query = query.filter(Order.cash_register_id == filter_data.cash_register_id)

    # Filter by shift if applicable
    if shift_id:
        query = query.filter(Order.shift_id == shift_id)

    # Filter by date range
    if start_date and end_date:
        query = query.filter(
            and_(
                Order.paid_at >= start_date,
                Order.paid_at <= end_date
            )
        )

    # Get orders
    orders = query.order_by(Order.paid_at.desc()).all()

    # Build details
    details: List[SalesDetail] = []
    total_sales = 0.0
    payment_method_totals: dict[str, dict] = {}

    for order in orders:
        # Get payments for this order
        payments = db.query(Payment).filter(Payment.order_id == order.id).all()
        
        cash_paid = 0.0
        other_paid = 0.0
        total_paid = 0.0

        for payment in payments:
            total_paid += float(payment.amount)
            
            if payment.payment_method:
                method_name = payment.payment_method.name
                method_type = payment.payment_method.type.value
                
                # Track payment method totals
                if method_name not in payment_method_totals:
                    payment_method_totals[method_name] = {
                        "name": method_name,
                        "type": method_type,
                        "total": 0.0
                    }
                payment_method_totals[method_name]["total"] += float(payment.amount)
                
                # Separate cash from other methods
                if method_type == "cash":
                    cash_paid += float(payment.amount)
                else:
                    other_paid += float(payment.amount)
            else:
                # No payment method assigned, treat as other
                other_paid += float(payment.amount)

        total_sales += total_paid

        # Get table number
        table_number = None
        if order.table:
            table_number = order.table.number or str(order.table.id)

        # Get customer name
        customer_name = None
        if order.customer:
            customer_name = order.customer.name

        details.append(SalesDetail(
            order_id=order.id,
            order_number=order.order_number,
            table_number=table_number,
            customer_name=customer_name,
            cash_paid=cash_paid,
            other_paid=other_paid,
            total_paid=total_paid,
            date=order.paid_at or order.created_at
        ))

    # Get beginning balance if cash register selected
    beginning_balance = None
    if filter_data.cash_register_id and shift_id:
        # Get cash register history for the shift
        history = db.query(CashRegisterHistory).filter(
            CashRegisterHistory.cash_register_id == filter_data.cash_register_id,
            CashRegisterHistory.shift_id == shift_id
        ).first()
        if history:
            beginning_balance = float(history.opening_balance)

    # Build payment method summary
    payment_methods = [
        PaymentMethodSummary(
            payment_method_name=pm["name"],
            payment_method_type=pm["type"],
            total_amount=pm["total"]
        )
        for pm in payment_method_totals.values()
    ]

    return SalesResponse(
        summary=SalesSummary(
            beginning_balance=beginning_balance,
            total_sales=total_sales,
            payment_methods=payment_methods
        ),
        details=details,
        start_date=start_date,
        end_date=end_date,
        cash_register_user=cash_register_user
    )

