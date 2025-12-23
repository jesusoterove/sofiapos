"""
Notification service for broadcasting entity updates via WebSocket.
"""
from typing import Optional
from datetime import datetime
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.services.websocket_manager import connection_manager

logger = logging.getLogger(__name__)

# Thread pool for running async tasks from sync context
_executor = ThreadPoolExecutor(max_workers=2)


def notify_entity_update(
    entity_type: str,
    entity_id: int,
    change_type: str = "update",
    store_id: Optional[int] = None,
    cash_register_id: Optional[int] = None
):
    """
    Broadcast an entity update notification to connected clients.
    This function can be called from both sync and async contexts.
    
    Args:
        entity_type: Type of entity (products, categories, materials, etc.)
        entity_id: ID of the updated entity
        change_type: Type of change (create, update, delete)
        store_id: Store ID for store-specific broadcasts
        cash_register_id: Cash register ID for specific cash register broadcasts
    """
    message = {
        "type": "entity_updated",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "change_type": change_type,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    logger.info(f"[NotificationService] Entity update notification triggered: {entity_type} #{entity_id} ({change_type}), store_id={store_id}, cash_register_id={cash_register_id}")
    logger.debug(f"[NotificationService] Message: {message}")
    
    try:
        # Try to get the current event loop
        try:
            loop = asyncio.get_running_loop()
            # If we're in an async context, schedule as a task
            logger.debug(f"[NotificationService] Scheduling broadcast in async context")
            loop.create_task(_broadcast_message(message, store_id, cash_register_id))
        except RuntimeError:
            # No running event loop, create a new one in a thread
            # This handles the case when called from sync context (e.g., after db.commit())
            logger.debug(f"[NotificationService] Scheduling broadcast in sync context (new event loop)")
            future = _executor.submit(_run_broadcast, message, store_id, cash_register_id)
            # Don't wait for completion - fire and forget
    except Exception as e:
        logger.error(f"Error scheduling notification broadcast: {e}", exc_info=True)


def _run_broadcast(message: dict, store_id: Optional[int], cash_register_id: Optional[int]):
    """Run broadcast in a new event loop (for sync context)."""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_broadcast_message(message, store_id, cash_register_id))
        loop.close()
    except Exception as e:
        logger.error(f"Error in _run_broadcast: {e}")


async def _broadcast_message(message: dict, store_id: Optional[int], cash_register_id: Optional[int]):
    """Internal async function to broadcast message."""
    try:
        logger.info(f"[NotificationService] Broadcasting message: cash_register_id={cash_register_id}, store_id={store_id}")
        if cash_register_id:
            await connection_manager.broadcast_to_cash_register(message, cash_register_id)
        elif store_id:
            await connection_manager.broadcast_to_store(message, store_id)
        else:
            # Broadcast to all if no specific target
            logger.info(f"[NotificationService] Broadcasting to all connected clients (no specific target)")
            await connection_manager.broadcast_to_all(message)
        logger.info(f"[NotificationService] Broadcast completed successfully")
    except Exception as e:
        logger.error(f"Error in _broadcast_message: {e}", exc_info=True)

