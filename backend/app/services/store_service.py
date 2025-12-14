"""
Store service utilities for managing store-related operations.
"""
from sqlalchemy.orm import Session
from app.models import Table, Setting, DocumentPrefix


def get_default_language(db: Session) -> str:
    """
    Get the default language from settings.
    Defaults to 'es' if not set.
    
    Args:
        db: Database session
        
    Returns:
        Language code ('en' or 'es')
    """
    setting = db.query(Setting).filter(
        Setting.key == "default_language",
        Setting.store_id == None  # Global setting
    ).first()
    
    if setting and setting.value:
        return setting.value.lower()
    
    return "es"  # Default to Spanish


def get_table_name_translation(language: str) -> str:
    """
    Get the translated word for "Table" based on language.
    
    Args:
        language: Language code ('en' or 'es')
        
    Returns:
        Translated word for "Table"
    """
    translations = {
        "en": "Table",
        "es": "Mesa",
    }
    
    return translations.get(language.lower(), "Table")  # Default to English if unknown


def ensure_store_tables(db: Session, store_id: int, default_tables_count: int, default_capacity: int = 4):
    """
    Ensure tables exist for a store based on default_tables_count.
    
    Creates tables with:
    - table_number: ordinal number as string (1, 2, 3, ...)
    - name: "{translated_table_word} {ordinal}" (e.g., "Mesa 1" for Spanish, "Table 1" for English)
    - capacity: default_capacity (default 4)
    - is_active: True for tables <= default_tables_count, False for others
    
    The table name uses the default_language setting from global settings.
    Default language is 'es' (Spanish) if not configured.
    
    Args:
        db: Database session
        store_id: Store ID
        default_tables_count: Number of default tables to ensure exist
        default_capacity: Default capacity for tables (default 4)
    """
    # Get default language from settings
    default_language = get_default_language(db)
    table_word = get_table_name_translation(default_language)
    
    # Get all existing tables for this store
    existing_tables = db.query(Table).filter(Table.store_id == store_id).all()
    existing_table_numbers = {table.table_number for table in existing_tables}
    
    # Create tables that don't exist (from 1 to default_tables_count)
    for ord_num in range(1, default_tables_count + 1):
        table_number = str(ord_num)
        table_name = f"{table_word} {ord_num}"
        
        if table_number not in existing_table_numbers:
            # Create new table
            new_table = Table(
                store_id=store_id,
                table_number=table_number,
                name=table_name,
                capacity=default_capacity,
                is_active=True
            )
            db.add(new_table)
        else:
            # Table exists - ensure it's active if within default_tables_count
            existing_table = next((t for t in existing_tables if t.table_number == table_number), None)
            if existing_table:
                existing_table.is_active = True
                # Update name if it's None or empty (but don't overwrite custom names)
                if not existing_table.name or existing_table.name.strip() == "":
                    existing_table.name = table_name
    
    # Mark tables with table_number > default_tables_count as inactive
    for table in existing_tables:
        try:
            table_num = int(table.table_number)
            if table_num > default_tables_count:
                table.is_active = False
        except (ValueError, TypeError):
            # If table_number is not a valid integer, skip it (might be custom)
            pass
    
    db.flush()  # Flush to ensure all changes are applied


def ensure_store_document_prefixes(db: Session, store_id: int):
    """
    Ensure default document prefixes exist for a store.
    
    Creates document prefixes with default values if they don't exist:
    - shift='T'
    - invoice='F'
    - inventory='I'
    - payment='P'
    
    Args:
        db: Database session
        store_id: Store ID
    """
    default_prefixes = {
        'shift': 'T',
        'invoice': 'F',
        'inventory': 'I',
        'payment': 'P',
    }
    
    for doc_type, prefix in default_prefixes.items():
        # Check if prefix already exists for this store
        existing = db.query(DocumentPrefix).filter(
            DocumentPrefix.store_id == store_id,
            DocumentPrefix.doc_type == doc_type
        ).first()
        
        if not existing:
            # Create new document prefix
            new_prefix = DocumentPrefix(
                store_id=store_id,
                doc_type=doc_type,
                prefix=prefix,
                is_active=True
            )
            db.add(new_prefix)
    
    db.flush()  # Flush to ensure all changes are applied

