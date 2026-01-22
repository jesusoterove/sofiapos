"""
Update notification service for sending update notifications via WebSocket.
"""
from typing import Optional, List
import logging
from app.models import ApplicationVersion
from app.services.websocket_manager import connection_manager

logger = logging.getLogger(__name__)


async def notify_update_available(
    version: ApplicationVersion,
    notify_all: bool = False,
    cash_register_ids: Optional[List[int]] = None
):
    """
    Notify clients about available update via WebSocket.
    
    Args:
        version: ApplicationVersion instance to notify about
        notify_all: If True, notify all connected clients
        cash_register_ids: Specific cash register IDs to notify (if notify_all is False)
    """
    # Build update notification message
    update_message = {
        "type": "update_available",
        "update_info": {
            "version": version.version,
            "platform": version.platform,
            "is_mandatory": version.is_mandatory,
            "release_notes": version.release_notes,
            "download_url": version.download_url,
            "file_size": version.file_size,
            "checksum": version.checksum,
            "release_date": version.release_date.isoformat() if version.release_date else None,
        },
        "timestamp": version.release_date.isoformat() if version.release_date else None,
    }
    
    if notify_all:
        # Broadcast to all connected clients
        logger.info(f"Broadcasting update notification for version {version.version} ({version.platform}) to all clients")
        await connection_manager.broadcast_to_all(update_message)
    elif cash_register_ids:
        # Send to specific cash registers
        logger.info(f"Sending update notification for version {version.version} ({version.platform}) to cash registers: {cash_register_ids}")
        for cash_register_id in cash_register_ids:
            await connection_manager.broadcast_to_cash_register(
                update_message,
                cash_register_id
            )
    else:
        # Send to all clients for this platform (filter by platform if needed)
        logger.info(f"Broadcasting update notification for version {version.version} ({version.platform}) to all clients")
        await connection_manager.broadcast_to_all(update_message)

