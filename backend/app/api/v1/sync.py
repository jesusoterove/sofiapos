"""
Incremental sync API endpoints.
Provides endpoints for syncing only changed records since a given timestamp.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import json
import logging
import asyncio

from app.database import get_db
from app.api.v1.auth import get_current_user
from app.models import (
    User, Product, ProductCategory, Material, UnitOfMeasure, Recipe, RecipeMaterial, 
    Setting, Table, InventoryControlConfig, DocumentPrefix, ProductUnitOfMeasure, 
    MaterialUnitOfMeasure, ProductTax, Tax, Store, CashRegister
)
from app.services.websocket_manager import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])

# Supported entity types
SUPPORTED_ENTITY_TYPES = [
    "products", "categories", "materials", "unit_of_measures", 
    "product_unit_of_measures", "material_unit_of_measures",
    "recipes", "recipe_materials", "settings", "tables", 
    "inventory_config", "document_prefixes"
]


@router.get("/incremental")
async def get_incremental_updates(
    entity_type: str = Query(..., description="Entity type to sync (products, categories, materials, etc.)"),
    since: str = Query(..., description="ISO timestamp - only return records updated after this time"),
    store_id: Optional[int] = Query(None, description="Store ID for store-specific entities"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get incremental updates for a specific entity type.
    Returns only records that have been updated since the given timestamp.
    """
    if entity_type not in SUPPORTED_ENTITY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid entity_type. Must be one of: {', '.join(SUPPORTED_ENTITY_TYPES)}"
        )
    
    try:
        # Parse timestamp
        since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timestamp format. Use ISO 8601 format (e.g., 2025-12-23T10:30:00Z)"
        )
    
    # Route to appropriate handler based on entity type
    if entity_type == "products":
        return await _get_products_incremental(db, since_dt)
    elif entity_type == "categories":
        return await _get_categories_incremental(db, since_dt)
    elif entity_type == "materials":
        return await _get_materials_incremental(db, since_dt)
    elif entity_type == "unit_of_measures":
        return await _get_unit_of_measures_incremental(db, since_dt)
    elif entity_type == "product_unit_of_measures":
        return await _get_product_unit_of_measures_incremental(db, since_dt)
    elif entity_type == "material_unit_of_measures":
        return await _get_material_unit_of_measures_incremental(db, since_dt)
    elif entity_type == "recipes":
        return await _get_recipes_incremental(db, since_dt)
    elif entity_type == "recipe_materials":
        return await _get_recipe_materials_incremental(db, since_dt)
    elif entity_type == "settings":
        return await _get_settings_incremental(db, since_dt)
    elif entity_type == "tables":
        if store_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="store_id is required for entity_type 'tables'"
            )
        return await _get_tables_incremental(db, since_dt, store_id)
    elif entity_type == "inventory_config":
        if store_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="store_id is required for entity_type 'inventory_config'"
            )
        return await _get_inventory_config_incremental(db, since_dt, store_id)
    elif entity_type == "document_prefixes":
        return await _get_document_prefixes_incremental(db, since_dt, store_id)
    
    return []


async def _get_products_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental product updates."""
    products = db.query(Product).options(
        joinedload(Product.taxes).joinedload(ProductTax.tax)
    ).filter(Product.updated_at > since_dt).all()
    
    result = []
    for product in products:
        # Calculate tax rate
        tax_rate = 0.0
        for product_tax in product.taxes:
            if product_tax.is_active and product_tax.tax and product_tax.tax.is_active:
                tax_rate += float(product_tax.tax.rate)
        
        result.append({
            "id": product.id,
            "name": product.name,
            "code": product.code,
            "description": product.description,
            "category_id": product.category_id,
            "product_type": product.product_type,
            "is_active": product.is_active,
            "selling_price": float(product.selling_price),
            "tax_rate": tax_rate,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        })
    return result


async def _get_categories_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental category updates."""
    categories = db.query(ProductCategory).filter(
        ProductCategory.updated_at > since_dt
    ).order_by(ProductCategory.display_order, ProductCategory.name).all()
    
    return [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "parent_id": category.parent_id,
            "display_order": category.display_order,
            "is_active": category.is_active,
            "created_at": category.created_at.isoformat() if category.created_at else None,
            "updated_at": category.updated_at.isoformat() if category.updated_at else None,
        }
        for category in categories
    ]


async def _get_materials_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental material updates."""
    from app.schemas.material import MaterialResponse
    materials = db.query(Material).filter(Material.updated_at > since_dt).all()
    
    result = []
    for material in materials:
        result.append({
            "id": material.id,
            "name": material.name,
            "description": material.description,
            "unit_of_measure_id": material.unit_of_measure_id,
            "unit_cost": float(material.unit_cost) if material.unit_cost else None,
            "vendor_id": material.vendor_id,
            "is_active": material.is_active,
            "created_at": material.created_at.isoformat() if material.created_at else None,
            "updated_at": material.updated_at.isoformat() if material.updated_at else None,
        })
    return result


async def _get_unit_of_measures_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental unit of measure updates."""
    units = db.query(UnitOfMeasure).filter(
        UnitOfMeasure.updated_at > since_dt
    ).order_by(UnitOfMeasure.name).all()
    
    return [
        {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "type": unit.type,
            "is_active": unit.is_active,
            "created_at": unit.created_at.isoformat() if unit.created_at else None,
            "updated_at": unit.updated_at.isoformat() if unit.updated_at else None,
        }
        for unit in units
    ]


async def _get_product_unit_of_measures_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """
    Get all product unit of measure records.
    Note: ProductUnitOfMeasure is a small array (max 5 records per product),
    so we return all records without filtering by updated_at.
    """
    # Return all records - no filtering needed for small dataset
    units = db.query(ProductUnitOfMeasure).all()
    
    return [
        {
            "id": unit.id,
            "product_id": unit.product_id,
            "unit_of_measure_id": unit.unit_of_measure_id,
            "conversion_factor": float(unit.conversion_factor),
            "is_base_unit": unit.is_base_unit,
            "display_order": unit.display_order,
            "created_at": unit.created_at.isoformat() if unit.created_at else None,
            "updated_at": unit.created_at.isoformat() if unit.created_at else None,  # Use created_at as fallback
        }
        for unit in units
    ]


async def _get_material_unit_of_measures_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """
    Get all material unit of measure records.
    Note: MaterialUnitOfMeasure is a small array (max 5 records per material),
    so we return all records without filtering by updated_at.
    """
    # Return all records - no filtering needed for small dataset
    units = db.query(MaterialUnitOfMeasure).all()
    
    return [
        {
            "id": unit.id,
            "material_id": unit.material_id,
            "unit_of_measure_id": unit.unit_of_measure_id,
            "conversion_factor": float(unit.conversion_factor),
            "is_base_unit": unit.is_base_unit,
            "display_order": unit.display_order,
            "created_at": unit.created_at.isoformat() if unit.created_at else None,
            "updated_at": unit.created_at.isoformat() if unit.created_at else None,  # Use created_at as fallback
        }
        for unit in units
    ]


async def _get_recipes_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental recipe updates."""
    recipes = db.query(Recipe).options(joinedload(Recipe.materials)).filter(
        Recipe.updated_at > since_dt
    ).all()
    
    result = []
    for recipe in recipes:
        result.append({
            "id": recipe.id,
            "product_id": recipe.product_id,
            "name": recipe.name,
            "description": recipe.description,
            "yield_quantity": float(recipe.yield_quantity),
            "yield_unit_of_measure_id": recipe.yield_unit_of_measure_id,
            "is_active": recipe.is_active,
            "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
            "updated_at": recipe.updated_at.isoformat() if recipe.updated_at else None,
        })
    return result


async def _get_recipe_materials_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental recipe material updates."""
    materials = db.query(RecipeMaterial).filter(
        RecipeMaterial.updated_at > since_dt
    ).all()
    
    return [
        {
            "id": material.id,
            "recipe_id": material.recipe_id,
            "material_id": material.material_id,
            "quantity": float(material.quantity),
            "unit_of_measure_id": material.unit_of_measure_id,
            "display_order": material.display_order,
            "created_at": material.created_at.isoformat() if material.created_at else None,
            "updated_at": material.updated_at.isoformat() if material.updated_at else None,
        }
        for material in materials
    ]


async def _get_settings_incremental(db: Session, since_dt: datetime) -> List[Dict[str, Any]]:
    """Get incremental setting updates."""
    from app.schemas.setting import SettingResponse
    settings = db.query(Setting).filter(Setting.updated_at > since_dt).all()
    
    result = []
    for setting in settings:
        # Convert value based on value_type
        value = setting.value
        if setting.value_type == "integer":
            value = int(setting.value) if setting.value else None
        elif setting.value_type == "float":
            value = float(setting.value) if setting.value else None
        elif setting.value_type == "boolean":
            value = setting.value.lower() in ("true", "1", "yes") if setting.value else None
        elif setting.value_type == "json":
            import json
            value = json.loads(setting.value) if setting.value else None
        
        result.append({
            "key": setting.key,
            "value": value,
            "value_type": setting.value_type,
            "store_id": setting.store_id,
            "created_at": setting.created_at.isoformat() if setting.created_at else None,
            "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
        })
    return result


async def _get_tables_incremental(db: Session, since_dt: datetime, store_id: int) -> List[Dict[str, Any]]:
    """Get incremental table updates."""
    from app.schemas.table import TableResponse
    tables = db.query(Table).filter(
        Table.store_id == store_id,
        Table.updated_at > since_dt
    ).order_by(Table.table_number).all()
    
    return [TableResponse.model_validate(table).model_dump() for table in tables]


async def _get_inventory_config_incremental(db: Session, since_dt: datetime, store_id: int) -> List[Dict[str, Any]]:
    """Get incremental inventory control config updates."""
    from app.schemas.inventory_control import InventoryControlConfigResponse
    config_items = db.query(InventoryControlConfig).filter(
        InventoryControlConfig.show_in_inventory == True,
        InventoryControlConfig.last_updated_dt > since_dt
    ).order_by(InventoryControlConfig.priority.asc()).all()
    
    # Enrich with related data (same as in inventory_control.py)
    result = []
    for item in config_items:
        item_dict = {
            "id": item.id,
            "item_type": item.item_type,
            "product_id": item.product_id,
            "material_id": item.material_id,
            "show_in_inventory": item.show_in_inventory,
            "priority": item.priority,
            "uofm1_id": item.uofm1_id,
            "uofm2_id": item.uofm2_id,
            "uofm3_id": item.uofm3_id,
            "product_name": None,
            "material_name": None,
            "uofm1_abbreviation": None,
            "uofm2_abbreviation": None,
            "uofm3_abbreviation": None,
        }
        
        if item.product_id:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                item_dict["product_name"] = product.name
        
        if item.material_id:
            material = db.query(Material).filter(Material.id == item.material_id).first()
            if material:
                item_dict["material_name"] = material.name
        
        if item.uofm1_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == item.uofm1_id).first()
            if uofm:
                item_dict["uofm1_abbreviation"] = uofm.abbreviation
        
        if item.uofm2_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == item.uofm2_id).first()
            if uofm:
                item_dict["uofm2_abbreviation"] = uofm.abbreviation
        
        if item.uofm3_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == item.uofm3_id).first()
            if uofm:
                item_dict["uofm3_abbreviation"] = uofm.abbreviation
        
        result.append(InventoryControlConfigResponse(**item_dict).model_dump())
    
    return result


async def _get_document_prefixes_incremental(db: Session, since_dt: datetime, store_id: Optional[int]) -> List[Dict[str, Any]]:
    """
    Get all active document prefix records.
    Note: DocumentPrefix doesn't have updated_at or created_at fields,
    so we return all active records without filtering by timestamp.
    """
    from app.schemas.document_prefix import DocumentPrefixResponse
    query = db.query(DocumentPrefix).filter(
        DocumentPrefix.is_active == True
    )
    
    if store_id is not None:
        query = query.filter(
            (DocumentPrefix.store_id == store_id) | (DocumentPrefix.store_id.is_(None))
        )
    
    prefixes = query.all()
    return [DocumentPrefixResponse.model_validate(prefix).model_dump() for prefix in prefixes]


@router.get("/check")
async def check_for_updates(
    since: str = Query(..., description="ISO timestamp - check for updates after this time"),
    store_id: Optional[int] = Query(None, description="Store ID for store-specific entities"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check which entity types have updates since the given timestamp.
    Returns a summary of which entities have changes.
    """
    try:
        since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timestamp format. Use ISO 8601 format (e.g., 2025-12-23T10:30:00Z)"
        )
    
    updates = {}
    
    # Check each entity type
    for entity_type in SUPPORTED_ENTITY_TYPES:
        count = 0
        
        if entity_type == "products":
            count = db.query(Product).filter(Product.updated_at > since_dt).count()
        elif entity_type == "categories":
            count = db.query(ProductCategory).filter(ProductCategory.updated_at > since_dt).count()
        elif entity_type == "materials":
            count = db.query(Material).filter(Material.updated_at > since_dt).count()
        elif entity_type == "unit_of_measures":
            count = db.query(UnitOfMeasure).filter(UnitOfMeasure.updated_at > since_dt).count()
        elif entity_type == "product_unit_of_measures":
            # Skip incremental check - ProductUnitOfMeasure doesn't have updated_at
            # and is a small dataset (max 5 records per product), so we always return all records
            # Always mark as having updates so it gets synced (returns all records)
            total_count = db.query(ProductUnitOfMeasure).count()
            count = total_count if total_count > 0 else 0
        elif entity_type == "material_unit_of_measures":
            # Skip incremental check - MaterialUnitOfMeasure doesn't have updated_at
            # and is a small dataset (max 5 records per material), so we always return all records
            # Always mark as having updates so it gets synced (returns all records)
            total_count = db.query(MaterialUnitOfMeasure).count()
            count = total_count if total_count > 0 else 0
        elif entity_type == "recipes":
            count = db.query(Recipe).filter(Recipe.updated_at > since_dt).count()
        elif entity_type == "recipe_materials":
            count = db.query(RecipeMaterial).filter(RecipeMaterial.updated_at > since_dt).count()
        elif entity_type == "settings":
            count = db.query(Setting).filter(Setting.updated_at > since_dt).count()
        elif entity_type == "tables":
            if store_id:
                count = db.query(Table).filter(
                    Table.store_id == store_id,
                    Table.updated_at > since_dt
                ).count()
        elif entity_type == "inventory_config":
            if store_id:
                count = db.query(InventoryControlConfig).filter(
                    InventoryControlConfig.last_updated_dt > since_dt
                ).count()
        elif entity_type == "document_prefixes":
            # Skip incremental check - DocumentPrefix doesn't have updated_at or created_at
            # Return all active records, so always mark as having updates if any exist
            query = db.query(DocumentPrefix).filter(DocumentPrefix.is_active == True)
            if store_id:
                query = query.filter(
                    (DocumentPrefix.store_id == store_id) | (DocumentPrefix.store_id.is_(None))
                )
            total_count = query.count()
            count = total_count if total_count > 0 else 0
        
        if count > 0:
            updates[entity_type] = count
    
    return {
        "has_updates": len(updates) > 0,
        "updates": updates,
        "checked_at": datetime.utcnow().isoformat() + "Z"
    }


@router.websocket("/ws/{cash_register_id}")
async def websocket_sync_endpoint(
    websocket: WebSocket,
    cash_register_id: int,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for real-time sync notifications.
    Clients connect to receive notifications when entities are updated.
    
    Query parameters:
    - token: Optional JWT token for authentication (can also be sent after connection)
    """
    print(f"[WebSocket Endpoint] 🔌 WebSocket connection request received")
    print(f"[WebSocket Endpoint] Client information:")
    print(f"  - Cash Register ID: {cash_register_id}")
    print(f"  - Token provided: {'Yes' if token else 'No'}")
    print(f"  - Client host: {websocket.client.host if websocket.client else 'Unknown'}")
    print(f"  - Client port: {websocket.client.port if websocket.client else 'Unknown'}")
    print(f"  - URL path: {websocket.url.path}")
    print(f"  - URL query: {websocket.url.query}")
    
    logger.info(f"[WebSocket Endpoint] Connection request from cash_register_{cash_register_id}")
    logger.info(f"[WebSocket Endpoint] Client: {websocket.client.host if websocket.client else 'Unknown'}:{websocket.client.port if websocket.client else 'Unknown'}")
    
    # TODO: Add authentication validation
    # For now, accept connections without strict auth (can be enhanced later)
    
    # Get store_id from cash_register if needed
    store_id = None
    user_id = None
    
    # Try to get store_id from cash_register
    try:
        print(f"[WebSocket Endpoint] Looking up cash register {cash_register_id} in database...")
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
            if cash_register:
                store_id = cash_register.store_id
                print(f"[WebSocket Endpoint] Found cash register: store_id={store_id}")
                logger.info(f"[WebSocket Endpoint] Cash register {cash_register_id} belongs to store {store_id}")
            else:
                print(f"[WebSocket Endpoint] ⚠️ Cash register {cash_register_id} not found in database")
                logger.warning(f"[WebSocket Endpoint] Cash register {cash_register_id} not found")
        finally:
            db.close()
    except Exception as e:
        print(f"[WebSocket Endpoint] ❌ Error looking up cash register: {e}")
        logger.warning(f"Could not get store_id for cash_register {cash_register_id}: {e}")
    
    # Connect the WebSocket
    print(f"[WebSocket Endpoint] Accepting WebSocket connection...")
    print(f"[WebSocket Endpoint] Connection parameters: cash_register_id={cash_register_id}, store_id={store_id}, user_id={user_id}")
    await connection_manager.connect(
        websocket,
        cash_register_id=cash_register_id,
        store_id=store_id,
        user_id=user_id
    )
    print(f"[WebSocket Endpoint] ✅ WebSocket connection accepted and registered")
    logger.info(f"[WebSocket Endpoint] WebSocket connection established for cash_register_{cash_register_id}")
    
    try:
        # Send welcome message
        welcome_message = {
            "type": "connected",
            "message": "WebSocket connected successfully",
            "cash_register_id": cash_register_id,
            "store_id": store_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        print(f"[WebSocket Endpoint] 📤 Sending welcome message to client")
        print(f"[WebSocket Endpoint] Welcome message: {json.dumps(welcome_message, indent=2)}")
        logger.info(f"[WebSocket] Sending welcome message to cash_register_{cash_register_id}: {json.dumps(welcome_message)}")
        try:
            await connection_manager.send_personal_message(welcome_message, websocket)
            print(f"[WebSocket Endpoint] ✅ Welcome message sent successfully")
            logger.info(f"[WebSocket] Welcome message sent successfully")
        except WebSocketDisconnect:
            print(f"[WebSocket Endpoint] ⚠️ Client disconnected while sending welcome message")
            logger.warning(f"[WebSocket] Client disconnected while sending welcome message")
            # Connection is already dead, exit
            return
        except Exception as e:
            print(f"[WebSocket Endpoint] ❌ Error sending welcome message: {type(e).__name__}: {e}")
            logger.error(f"[WebSocket] Error sending welcome message: {e}", exc_info=True)
            # Connection failed, exit
            return
        print(f"[WebSocket Endpoint] 🔄 Entering message receive loop...")
        logger.info(f"[WebSocket] Entering message receive loop for cash_register_{cash_register_id}")
        
        # Keep connection alive and listen for messages
        while True:
            try:
                print(f"[WebSocket Endpoint] ⏳ Waiting for message from client...")
                logger.debug(f"[WebSocket] Waiting for message from cash_register_{cash_register_id}")
                # Wait for messages from client (heartbeat, etc.)
                # Client sends ping every 20 seconds, so we should receive something within 30 seconds
                # Use a timeout to detect dead connections
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                except asyncio.TimeoutError:
                    # No message received - connection might be dead
                    # Try to send a ping to check if connection is still alive
                    logger.debug(f"[WebSocket] No message received in 30 seconds, checking connection health")
                    try:
                        # Try to send a ping - if this fails, connection is dead
                        await connection_manager.send_personal_message({
                            "type": "ping",
                            "timestamp": datetime.utcnow().isoformat() + "Z"
                        }, websocket)
                        # If ping succeeded, continue waiting
                        continue
                    except (WebSocketDisconnect, Exception) as ping_error:
                        logger.warning(f"[WebSocket] Error sending ping, connection is dead: {ping_error}")
                        break
                except WebSocketDisconnect:
                    # Client disconnected while waiting for message
                    logger.info(f"[WebSocket] Client disconnected while receiving message: cash_register_{cash_register_id}")
                    break
                logger.info(f"[WebSocket] Message received: {data}")
                logger.info(f"[WebSocket] Received message from cash_register_{cash_register_id}: {data}")
                try:
                    message = json.loads(data)
                    logger.debug(f"[WebSocket] Parsed message: {message}")
                    if message.get("type") == "ping":
                        # Respond to ping with pong
                        logger.debug(f"[WebSocket] Responding to ping with pong")
                        try:
                            await connection_manager.send_personal_message({
                                "type": "pong",
                                "timestamp": datetime.utcnow().isoformat() + "Z"
                            }, websocket)
                        except (WebSocketDisconnect, Exception) as pong_error:
                            logger.warning(f"[WebSocket] Error sending pong response: {pong_error}")
                            break
                    else:
                        logger.warning(f"[WebSocket] Unknown message type received: {message.get('type')}")
                except json.JSONDecodeError:
                    logger.warning(f"[WebSocket] Invalid JSON received from WebSocket: {data}")
            except WebSocketDisconnect:
                print(f"[WebSocket Endpoint] 🔌 WebSocketDisconnect exception in message loop")
                logger.info(f"[WebSocket] Client disconnected: cash_register_{cash_register_id}")
                break
            except Exception as e:
                print(f"[WebSocket Endpoint] ❌ Exception in message loop: {type(e).__name__}: {e}")
                logger.error(f"[WebSocket] Error in message loop: {e}", exc_info=True)
                break
    except WebSocketDisconnect:
        print(f"[WebSocket Endpoint] 🔌 WebSocketDisconnect exception caught in outer try block")
        logger.info(f"[WebSocket Endpoint] Client disconnected: cash_register_{cash_register_id}")
    except Exception as e:
        print(f"[WebSocket Endpoint] ❌ Exception caught in outer try block: {type(e).__name__}: {e}")
        import traceback
        print(f"[WebSocket Endpoint] Traceback:\n{traceback.format_exc()}")
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        print(f"[WebSocket Endpoint] 🧹 Cleaning up connection for cash_register_{cash_register_id}")
        try:
            # Properly close the WebSocket connection
            await connection_manager.disconnect_and_close(websocket)
        except Exception as cleanup_error:
            logger.warning(f"Error during WebSocket cleanup: {cleanup_error}")
            # Fallback to simple disconnect if close fails
            connection_manager.disconnect(websocket)
        print(f"[WebSocket Endpoint] Connection cleanup completed")

