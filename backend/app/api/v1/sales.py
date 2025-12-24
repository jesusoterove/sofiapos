"""
Sales API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import List, Optional
from datetime import datetime, timedelta, timezone

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
    timezone_offset: Optional[int],
    db: Session
) -> tuple[Optional[datetime], Optional[datetime], Optional[int], Optional[str]]:
    """
    Get start and end dates based on filter mode.
    Handles timezone conversion from client timezone to UTC.
    Returns: (start_date, end_date, shift_id, cash_register_user)
    """
    # Get UTC now (naive datetime for compatibility with database)
    now_utc = datetime.utcnow()
    
    # Calculate client timezone offset (default to UTC if not provided)
    # timezone_offset is in minutes: positive = ahead of UTC, negative = behind UTC
    # Example: EST is UTC-5, so offset = -300 minutes
    # Note: JavaScript getTimezoneOffset() returns positive for behind UTC, negative for ahead
    # So EST (UTC-5) would send -300, which is correct
    tz_offset_minutes = timezone_offset if timezone_offset is not None else 0
    tz_offset = timedelta(minutes=tz_offset_minutes)
    
    # Debug logging (can be removed later)
    if filter_mode in ["today", "yesterday", "last_week", "last_month", "date_range"]:
        print(f"[DEBUG] timezone_offset: {timezone_offset}, tz_offset_minutes: {tz_offset_minutes}, tz_offset: {tz_offset}")
        print(f"[DEBUG] now_utc: {now_utc}")
    
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
            # Ensure both dates are timezone-aware (UTC) for consistent serialization
            if shift.opened_at.tzinfo is None:
                start_date = shift.opened_at.replace(tzinfo=timezone.utc)
            else:
                start_date = shift.opened_at.astimezone(timezone.utc)
            end_date = now_utc.replace(tzinfo=timezone.utc)
            
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
            # Ensure both dates are timezone-aware (UTC) for consistent serialization
            if shift.opened_at.tzinfo is None:
                start_date = shift.opened_at.replace(tzinfo=timezone.utc)
            else:
                start_date = shift.opened_at.astimezone(timezone.utc)
            if shift.closed_at and shift.closed_at.tzinfo is None:
                end_date = shift.closed_at.replace(tzinfo=timezone.utc)
            elif shift.closed_at:
                end_date = shift.closed_at.astimezone(timezone.utc)
            else:
                end_date = None
            
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
        # Today: from start of today (00:00 AM) in client timezone to current datetime
        # Convert UTC to client timezone for date calculations
        # If client is UTC-5 (offset=-300), we subtract 5 hours from UTC to get client time
        client_now = now_utc + tz_offset  # Add offset to get client time (UTC + (-5hrs) = client time)
        client_today_start = client_now.replace(hour=0, minute=0, second=0, microsecond=0)
        client_today_end = client_now  # Current datetime
        
        # Convert back to UTC: subtract the offset (which is negative, so we add hours)
        # If client is UTC-5 (offset=-300), client_time - (-300min) = client_time + 5hrs = UTC
        # Create timezone-aware datetimes by first converting to UTC properly
        start_date_utc_naive = client_today_start - tz_offset
        end_date_utc_naive = client_today_end - tz_offset
        start_date = start_date_utc_naive.replace(tzinfo=timezone.utc)
        end_date = end_date_utc_naive.replace(tzinfo=timezone.utc)

    elif filter_mode == "yesterday":
        # Yesterday: from start of yesterday (00:00) to end of yesterday (23:59:59) in client timezone
        client_now = now_utc + tz_offset  # Add offset to get client time
        client_yesterday = client_now - timedelta(days=1)
        client_yesterday_start = client_yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        client_yesterday_end = client_yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Convert back to UTC: subtract the offset
        start_date = (client_yesterday_start - tz_offset).replace(tzinfo=timezone.utc)
        end_date = (client_yesterday_end - tz_offset).replace(tzinfo=timezone.utc)

    elif filter_mode == "last_week":
        # Last week: 7 days ago from now in client timezone
        # Start date: beginning of the day 7 days ago
        # End date: end of period (23:59:59) or current time, whichever is minimum
        client_now = now_utc + tz_offset  # Add offset to get client time
        client_week_ago = client_now - timedelta(days=7)
        client_week_ago_start = client_week_ago.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # End date is current time (already at the end of the period)
        # Convert back to UTC: subtract the offset
        start_date = (client_week_ago_start - tz_offset).replace(tzinfo=timezone.utc)
        end_date = (client_now - tz_offset).replace(tzinfo=timezone.utc)  # Current time

    elif filter_mode == "last_month":
        # Last month: 30 days ago from now in client timezone
        # Start date: beginning of the day 30 days ago
        # End date: end of period (23:59:59) or current time, whichever is minimum
        client_now = now_utc + tz_offset  # Add offset to get client time
        client_month_ago = client_now - timedelta(days=30)
        client_month_ago_start = client_month_ago.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # End date is current time (already at the end of the period)
        # Convert back to UTC: subtract the offset
        start_date = (client_month_ago_start - tz_offset).replace(tzinfo=timezone.utc)
        end_date = (client_now - tz_offset).replace(tzinfo=timezone.utc)  # Current time

    elif filter_mode == "date_range":
        if not start_date or not end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date and end date are required for date range filter"
            )
        # If dates are provided, extract the date part and set times appropriately
        # Start date: beginning of the selected day (00:00:00) in client timezone
        # End date: end of the selected day (23:59:59) in client timezone
        # Then convert both to UTC
        
        # Normalize start_date to beginning of day in client timezone
        if start_date.tzinfo is None:
            # Naive datetime - assume it's in client timezone
            # Extract date part and set to beginning of day (00:00:00)
            start_date_client = datetime(
                start_date.year, start_date.month, start_date.day,
                hour=0, minute=0, second=0, microsecond=0
            )
        else:
            # Timezone-aware datetime - convert to client timezone first
            start_date_client_tz = start_date.astimezone(timezone(timedelta(minutes=tz_offset_minutes)))
            start_date_client = datetime(
                start_date_client_tz.year, start_date_client_tz.month, start_date_client_tz.day,
                hour=0, minute=0, second=0, microsecond=0
            )
        # Convert to UTC
        start_date = (start_date_client - tz_offset).replace(tzinfo=timezone.utc)
        
        # Normalize end_date to end of day in client timezone
        if end_date.tzinfo is None:
            # Naive datetime - assume it's in client timezone
            # Extract date part and set to end of day (23:59:59)
            end_date_client = datetime(
                end_date.year, end_date.month, end_date.day,
                hour=23, minute=59, second=59, microsecond=999999
            )
        else:
            # Timezone-aware datetime - convert to client timezone first
            end_date_client_tz = end_date.astimezone(timezone(timedelta(minutes=tz_offset_minutes)))
            end_date_client = datetime(
                end_date_client_tz.year, end_date_client_tz.month, end_date_client_tz.day,
                hour=23, minute=59, second=59, microsecond=999999
            )
        # Convert to UTC
        end_date = (end_date_client - tz_offset).replace(tzinfo=timezone.utc)
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
        filter_data.timezone_offset,
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
    # When filtering by shift_id, use ONLY shift_id - do not include date ranges
    if shift_id:
        query = query.filter(Order.shift_id == shift_id)
    else:
        # Only apply date range filters if NOT filtering by shift_id
        if start_date and end_date:
            # Convert timezone-aware datetimes to naive for database comparison
            # Database stores UTC as naive datetimes
            start_date_naive = start_date.replace(tzinfo=None) if start_date.tzinfo else start_date
            end_date_naive = end_date.replace(tzinfo=None) if end_date.tzinfo else end_date
            query = query.filter(
                and_(
                    Order.paid_at >= start_date_naive,
                    Order.paid_at <= end_date_naive
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
        end_date=filter_data.end_date,
        timezone_offset=filter_data.timezone_offset
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

