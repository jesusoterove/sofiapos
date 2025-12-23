"""
WebSocket connection manager for real-time sync notifications.
Manages WebSocket connections and broadcasts messages to connected clients.
"""
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for sync notifications."""
    
    def __init__(self):
        # Store connections by cash_register_id or store_id
        # Format: {identifier: Set[WebSocket]}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store connection metadata
        # Format: {websocket: {"cash_register_id": int, "store_id": int, "user_id": int}}
        self.connection_metadata: Dict[WebSocket, Dict[str, Optional[int]]] = {}
    
    async def connect(self, websocket: WebSocket, cash_register_id: Optional[int] = None, store_id: Optional[int] = None, user_id: Optional[int] = None):
        """Accept a WebSocket connection and register it."""
        await websocket.accept()
        
        # Use cash_register_id as primary identifier, fallback to store_id
        identifier = f"cash_register_{cash_register_id}" if cash_register_id else f"store_{store_id}" if store_id else "unknown"
        
        if identifier not in self.active_connections:
            self.active_connections[identifier] = set()
        
        self.active_connections[identifier].add(websocket)
        self.connection_metadata[websocket] = {
            "cash_register_id": cash_register_id,
            "store_id": store_id,
            "user_id": user_id,
            "identifier": identifier
        }
        
        logger.info(f"WebSocket connected: {identifier} (total connections: {sum(len(conns) for conns in self.active_connections.values())})")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from the manager."""
        if websocket in self.connection_metadata:
            metadata = self.connection_metadata[websocket]
            identifier = metadata.get("identifier")
            
            if identifier and identifier in self.active_connections:
                self.active_connections[identifier].discard(websocket)
                if len(self.active_connections[identifier]) == 0:
                    del self.active_connections[identifier]
            
            del self.connection_metadata[websocket]
            logger.info(f"WebSocket disconnected: {identifier}")
    
    async def disconnect_and_close(self, websocket: WebSocket):
        """Properly close and remove a WebSocket connection."""
        # Check if websocket is already in the manager before trying to close
        if websocket not in self.connection_metadata:
            # Already disconnected, nothing to do
            return
        
        try:
            # Check connection state before closing
            # FastAPI WebSocket doesn't expose state directly, so we try to close
            # and catch any errors if it's already closed
            await websocket.close()
        except RuntimeError as e:
            # Connection already closed or in invalid state
            if "already closed" in str(e).lower() or "websocket.close" in str(e):
                logger.debug(f"WebSocket already closed, skipping close operation")
            else:
                logger.warning(f"Error closing WebSocket during disconnect: {e}")
        except Exception as e:
            logger.warning(f"Error closing WebSocket during disconnect: {e}")
        finally:
            # Remove from manager (idempotent - safe to call multiple times)
            self.disconnect(websocket)
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection."""
        try:
            logger.info(f"[WebSocket] Sending message to client: {json.dumps(message)}")
            await websocket.send_json(message)
            logger.debug(f"[WebSocket] Message sent successfully")
        except WebSocketDisconnect:
            # Client disconnected normally - don't close, just remove from manager
            logger.info(f"[WebSocket] Client disconnected while sending message (WebSocketDisconnect)")
            self.disconnect(websocket)
            # Re-raise so caller knows the connection is dead
            raise
        except Exception as e:
            logger.error(f"Error sending personal message: {type(e).__name__}: {e}")
            # Don't close here - let the caller handle it
            # Just remove from manager
            self.disconnect(websocket)
            # Re-raise so caller can handle
            raise
    
    async def broadcast_to_store(self, message: dict, store_id: int):
        """Broadcast a message to all connections for a specific store."""
        identifier = f"store_{store_id}"
        await self._broadcast_to_identifier(message, identifier)
    
    async def broadcast_to_cash_register(self, message: dict, cash_register_id: int):
        """Broadcast a message to a specific cash register."""
        identifier = f"cash_register_{cash_register_id}"
        await self._broadcast_to_identifier(message, identifier)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all connected clients."""
        for identifier in list(self.active_connections.keys()):
            await self._broadcast_to_identifier(message, identifier)
    
    async def _broadcast_to_identifier(self, message: dict, identifier: str):
        """Broadcast a message to all connections with a specific identifier."""
        if identifier not in self.active_connections:
            logger.warning(f"[WebSocket] No connections found for identifier: {identifier}")
            return
        
        connection_count = len(self.active_connections[identifier])
        logger.info(f"[WebSocket] Broadcasting message to {connection_count} connection(s) for {identifier}: {json.dumps(message)}")
        
        disconnected = set()
        for websocket in self.active_connections[identifier]:
            try:
                await websocket.send_json(message)
                logger.debug(f"[WebSocket] Message broadcasted successfully to {identifier}")
            except Exception as e:
                logger.error(f"Error broadcasting to {identifier}: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected connections - properly close them
        for websocket in disconnected:
            try:
                await websocket.close()
            except Exception as close_error:
                logger.warning(f"Error closing WebSocket during broadcast cleanup: {close_error}")
            self.disconnect(websocket)
    
    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return sum(len(conns) for conns in self.active_connections.values())


# Global instance
connection_manager = ConnectionManager()

