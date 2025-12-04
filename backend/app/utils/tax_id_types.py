"""
Utility functions for tax ID types.
Tax ID types are stored as a global setting in the format: "value|label;value|label"
Default: "NIT|NIT;CC|Cédula;CE|Cédula Extranjería"
"""
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models import Setting


def parse_tax_id_types(setting_value: str) -> List[Dict[str, str]]:
    """
    Parse tax ID types setting value into list of dictionaries.
    
    Args:
        setting_value: Setting value in format "value|label;value|label"
    
    Returns:
        List of dicts with 'value' and 'label' keys
        Example: [{"value": "NIT", "label": "NIT"}, {"value": "CC", "label": "Cédula"}]
    """
    if not setting_value:
        return []
    
    types = []
    for item in setting_value.split(';'):
        if '|' in item:
            value, label = item.split('|', 1)
            types.append({"value": value.strip(), "label": label.strip()})
    
    return types


def format_tax_id_types(types: List[Dict[str, str]]) -> str:
    """
    Format list of tax ID types into setting value format.
    
    Args:
        types: List of dicts with 'value' and 'label' keys
    
    Returns:
        Formatted string: "value|label;value|label"
    """
    return ';'.join([f"{t['value']}|{t['label']}" for t in types])


def get_tax_id_types(db: Session) -> List[Dict[str, str]]:
    """
    Get tax ID types from global setting.
    
    Args:
        db: Database session
    
    Returns:
        List of dicts with 'value' and 'label' keys
    """
    setting = db.query(Setting).filter(
        Setting.key == "customer_tax_id_types",
        Setting.store_id == None
    ).first()
    
    if setting and setting.value:
        return parse_tax_id_types(setting.value)
    
    # Return default if setting not found
    return parse_tax_id_types("NIT|NIT;CC|Cédula;CE|Cédula Extranjería")


def get_default_tax_id_types() -> List[Dict[str, str]]:
    """
    Get default tax ID types (used when setting is not available).
    
    Returns:
        List of dicts with 'value' and 'label' keys
    """
    return parse_tax_id_types("NIT|NIT;CC|Cédula;CE|Cédula Extranjería")


def validate_tax_id_type(tax_id_type: Optional[str], db: Session) -> bool:
    """
    Validate if tax_id_type is in the allowed list.
    
    Args:
        tax_id_type: Tax ID type to validate
        db: Database session
    
    Returns:
        True if valid, False otherwise
    """
    if tax_id_type is None:
        return True  # Null is allowed
    
    allowed_types = get_tax_id_types(db)
    allowed_values = [t["value"] for t in allowed_types]
    
    return tax_id_type in allowed_values

