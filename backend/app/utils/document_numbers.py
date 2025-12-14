"""
Document number generation utilities.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models import Order, DocumentPrefix, CashRegister
from app.utils.base36 import encode_base36, pad_base36


def generate_order_number(
    db: Session,
    cash_register_id: int,
    cash_register_code: str,
    store_id: int
) -> str:
    """
    Generate a unique order number for a cash register.
    Format: {prefix}{cash_register_code}-{base36(timestamp)}
    Example: FSAA-AAA-ABC1234 (where F is prefix, SAA-AAA is cash register code, ABC1234 is base36 timestamp)
    """
    # Get invoice document prefix from store
    doc_prefix = db.query(DocumentPrefix).filter(
        DocumentPrefix.store_id == store_id,
        DocumentPrefix.doc_type == 'invoice',
        DocumentPrefix.is_active == True
    ).first()
    
    if not doc_prefix:
        prefix = ''
    else:
        prefix = doc_prefix.prefix
    
    # Get current timestamp in yyyyMMddHHmmss format and encode to base36
    now = datetime.now()
    timestamp = int(now.strftime("%Y%m%d%H%M%S"))  # yyyyMMddHHmmss format
    timestamp_base36 = encode_base36(timestamp)
    
    # Combine: prefix + cash_register_code + '-' + base36(timestamp)
    order_number = f"{prefix}{cash_register_code}-{timestamp_base36}"
    
    return order_number

