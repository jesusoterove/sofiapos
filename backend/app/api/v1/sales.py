"""
Sales API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    Order, Payment, PaymentMethod, Store, CashRegister, Shift, ShiftUser, User,
    Customer, Table, CashRegisterHistory
)
from app.schemas.sales import (
    SalesFilterRequest, SalesDetailsRequest, SalesResponse, SalesSummaryResponse, SalesDetailsResponse,
    SalesSummary, SalesDetail, PaymentMethodSummary
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

    elif filter_mode == "today":
        # Today: from start of today to now
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now

    elif filter_mode == "yesterday":
        # Yesterday: from start of yesterday to end of yesterday
        yesterday = now - timedelta(days=1)
        start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

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


def build_sales_query(
    filter_data: SalesFilterRequest,
    db: Session,
    current_user: User
) -> tuple:
    """
    Build the base query for sales data and return query, start_date, end_date, shift_id, cash_register_user.
    """
    # Get date range based on filter mode
    start_date, end_date, shift_id, cash_register_user = get_date_range_for_filter_mode(
        filter_data.filter_mode,
        filter_data.cash_register_id,
        filter_data.start_date,
        filter_data.end_date,
        db
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

    return query, start_date, end_date, shift_id, cash_register_user


def calculate_summary_from_query(
    query,
    cash_register_id: Optional[int],
    shift_id: Optional[int],
    db: Session
) -> SalesSummary:
    """
    Calculate sales summary using SQL aggregates instead of iterating over orders.
    This is much more efficient for large datasets.
    """
    # Get order IDs from the filtered query as a subquery
    order_ids_subquery = query.with_entities(Order.id).subquery()
    
    # Calculate total sales using SQL aggregate - join Payment with filtered orders
    total_sales_result = db.query(func.sum(Payment.amount)).join(
        order_ids_subquery, Payment.order_id == order_ids_subquery.c.id
    ).scalar()
    total_sales = float(total_sales_result) if total_sales_result else 0.0

    # Calculate payment method totals using SQL aggregates with GROUP BY
    payment_method_totals_query = db.query(
        PaymentMethod.name.label('method_name'),
        PaymentMethod.type.label('method_type'),
        func.sum(Payment.amount).label('total_amount')
    ).join(
        Payment, Payment.payment_method_id == PaymentMethod.id
    ).join(
        order_ids_subquery, Payment.order_id == order_ids_subquery.c.id
    ).group_by(
        PaymentMethod.id, PaymentMethod.name, PaymentMethod.type
    ).all()

    # Build payment method summary from query results
    payment_methods = [
        PaymentMethodSummary(
            payment_method_name=row.method_name,
            payment_method_type=row.method_type.value,
            total_amount=float(row.total_amount)
        )
        for row in payment_method_totals_query
    ]

    # Get beginning balance if cash register selected
    beginning_balance = None
    if cash_register_id and shift_id:
        # Get cash register history for the shift
        history = db.query(CashRegisterHistory).filter(
            CashRegisterHistory.cash_register_id == cash_register_id,
            CashRegisterHistory.shift_id == shift_id
        ).first()
        if history:
            beginning_balance = float(history.opening_balance)

    return SalesSummary(
        beginning_balance=beginning_balance,
        total_sales=total_sales,
        payment_methods=payment_methods
    )


def build_details_from_orders(orders: List[Order], db: Session) -> List[SalesDetail]:
    """Build sales details from a list of orders."""
    details: List[SalesDetail] = []

    for order in orders:
        # Get payments for this order
        payments = db.query(Payment).filter(Payment.order_id == order.id).all()
        
        cash_paid = 0.0
        other_paid = 0.0
        total_paid = 0.0

        for payment in payments:
            total_paid += float(payment.amount)
            
            if payment.payment_method:
                method_type = payment.payment_method.type.value
                # Separate cash from other methods
                if method_type == "cash":
                    cash_paid += float(payment.amount)
                else:
                    other_paid += float(payment.amount)
            else:
                # No payment method assigned, treat as other
                other_paid += float(payment.amount)

        # Get table number
        table_number = None
        if order.table:
            table_number = order.table.table_number or str(order.table.id)

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

    return details


@router.post("/summary", response_model=SalesSummaryResponse)
async def get_sales_summary(
    filter_data: SalesFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sales summary only (no details).
    Returns summary data for the filter criteria.
    """
    query, start_date, end_date, shift_id, cash_register_user = build_sales_query(
        filter_data, db, current_user
    )

    if start_date is None and filter_data.filter_mode in ["current_shift", "last_shift"]:
        # No shift found
        return SalesSummaryResponse(
            summary=SalesSummary(
                beginning_balance=None,
                total_sales=0.0,
                payment_methods=[]
            ),
            start_date=None,
            end_date=None,
            cash_register_user=None
        )

    # Calculate summary using SQL aggregates (no need to fetch all orders)
    summary = calculate_summary_from_query(query, filter_data.cash_register_id, shift_id, db)

    return SalesSummaryResponse(
        summary=summary,
        start_date=start_date,
        end_date=end_date,
        cash_register_user=cash_register_user
    )


@router.post("/details", response_model=SalesDetailsResponse)
async def get_sales_details(
    filter_data: SalesDetailsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated sales details.
    Returns paginated order details for the grid.
    """
    # Convert SalesDetailsRequest to SalesFilterRequest for query building
    filter_request = SalesFilterRequest(
        store_id=filter_data.store_id,
        cash_register_id=filter_data.cash_register_id,
        filter_mode=filter_data.filter_mode,
        start_date=filter_data.start_date,
        end_date=filter_data.end_date
    )

    query, start_date, end_date, shift_id, cash_register_user = build_sales_query(
        filter_request, db, current_user
    )

    # Get total count before pagination
    total_count = query.count()

    print(f"querying {total_count} orders. store_id: {filter_data.store_id}, cash_register_id: {filter_data.cash_register_id}, filter_mode: {filter_data.filter_mode}, start_date: {filter_data.start_date}, end_date: {filter_data.end_date}")

    # Apply pagination
    offset = (filter_data.page - 1) * filter_data.page_size
    orders = query.order_by(Order.paid_at.desc()).offset(offset).limit(filter_data.page_size).all()

    # Build details
    details = build_details_from_orders(orders, db)

    # Calculate total pages
    total_pages = (total_count + filter_data.page_size - 1) // filter_data.page_size

    return SalesDetailsResponse(
        details=details,
        total_count=total_count,
        page=filter_data.page,
        page_size=filter_data.page_size,
        total_pages=total_pages
    )


@router.post("/", response_model=SalesResponse)
async def get_sales(
    filter_data: SalesFilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sales data based on filters (legacy endpoint - returns both summary and details).
    Returns paid orders with payment details.
    """
    query, start_date, end_date, shift_id, cash_register_user = build_sales_query(
        filter_data, db, current_user
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

    # Calculate summary using SQL aggregates (no need to fetch all orders)
    summary = calculate_summary_from_query(query, filter_data.cash_register_id, shift_id, db)

    # Build details
    details = build_details_from_orders(orders, db)

    return SalesResponse(
        summary=summary,
        details=details,
        start_date=start_date,
        end_date=end_date,
        cash_register_user=cash_register_user
    )

