# Incremental Synchronization Plan

## Overview
Implement incremental synchronization from server to POS app with real-time update notifications. When products, categories, or other synced entities are updated on the server, all connected POS clients will receive notifications and automatically sync the changes.

## ⚠️ CRITICAL REQUIREMENT: Non-Blocking, Silent Sync

**The sync process must NEVER interrupt POS operations or annoy the cash register operator.**

- ❌ **NO toast notifications** for sync errors or failures
- ✅ **ONLY visual indicators** in the bottom bar (already implemented)
- ✅ **Background operation** - sync runs silently without blocking
- ✅ **Operator control** - operator can check sync status when convenient
- ✅ **Error resilience** - sync failures don't affect POS functionality

All sync operations must update the `SyncContext` state, which automatically triggers the bottom bar indicators. The operator can click these indicators to view details or retry sync when they have a moment.

**Existing Bottom Bar Indicators (Already Implemented):**
- ✅ Online/Offline status badge
- ✅ Sync error button (shows when sync fails) - `FaExclamationTriangle` icon
- ✅ Sync auth failure button (shows when authentication fails) - `FaSync` icon with danger variant
- ✅ Pending sync count display
- ✅ "Sync Now" button for manual trigger

**Implementation Requirements:**
1. All sync operations must be wrapped in try-catch blocks
2. Errors must update `SyncContext` state, NOT show toasts
3. BottomBar component already listens to sync state and displays indicators
4. Operator can click indicators to view details or retry when convenient
5. Sync must never block or delay POS operations
6. Use `requestIdleCallback` or similar for low-priority sync operations

## Architecture

### 1. Server-Side Components

#### 1.1 Change Tracking
- **Database**: All models already have `updated_at` timestamps
- **Change Log Table** (Optional Enhancement):
  - Track entity type, entity ID, change type (create/update/delete), timestamp
  - Can be used for audit trail and more efficient change queries

#### 1.2 Incremental Sync API Endpoints
Create endpoints for each synced entity type:
- `GET /api/v1/sync/products?since={timestamp}` - Get products updated since timestamp
- `GET /api/v1/sync/categories?since={timestamp}`
- `GET /api/v1/sync/materials?since={timestamp}`
- `GET /api/v1/sync/unit-of-measures?since={timestamp}`
- `GET /api/v1/sync/product-unit-of-measures?since={timestamp}`
- `GET /api/v1/sync/material-unit-of-measures?since={timestamp}`
- `GET /api/v1/sync/recipes?since={timestamp}`
- `GET /api/v1/sync/recipe-materials?since={timestamp}`
- `GET /api/v1/sync/settings?since={timestamp}`
- `GET /api/v1/sync/tables?since={timestamp}&store_id={store_id}`
- `GET /api/v1/sync/inventory-config?since={timestamp}&store_id={store_id}`
- `GET /api/v1/sync/document-prefixes?since={timestamp}&store_id={store_id}`

**Alternative**: Single endpoint with entity type parameter:
- `GET /api/v1/sync/incremental?entity_type={type}&since={timestamp}&store_id={store_id}`

#### 1.3 Real-Time Notification System

**Option A: WebSocket (Recommended) - ✅ Selected**
- FastAPI WebSocket endpoint: `/ws/sync/{cash_register_id}` or `/ws/sync/{store_id}`
- Server broadcasts changes to all connected clients
- Message format:
  ```json
  {
    "type": "entity_updated",
    "entity_type": "product",
    "entity_id": 123,
    "change_type": "update",
    "timestamp": "2025-12-23T10:30:00Z"
  }
  ```

**Infrastructure Decision: Same Container as API ✅**

**Answer: WebSocket can run in the same container as the API - no separate container needed.**

**Technical Details:**
- FastAPI natively supports WebSocket connections via ASGI protocol
- uvicorn (ASGI server) can handle both HTTP and WebSocket connections simultaneously on the same port
- Current setup already uses uvicorn: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- WebSocket endpoint will be added to the same FastAPI app instance
- Same port (8000), same server, same deployment

**Benefits of Same Container:**
- ✅ Simpler deployment (one container, one service)
- ✅ Shared authentication/authorization logic
- ✅ Shared database connections and connection pool
- ✅ Lower resource overhead (no duplicate processes)
- ✅ Easier to maintain and debug
- ✅ No additional network configuration needed
- ✅ Same CORS and security policies apply

**Implementation:**
```python
# In backend/app/api/v1/sync.py or backend/app/main.py
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/sync/{cash_register_id}")
async def websocket_sync(websocket: WebSocket, cash_register_id: int):
    await websocket.accept()
    # ... handle WebSocket connection
```

**Scaling Considerations (Future):**
- **Current (Single Instance)**: Works perfectly in same container
- **Horizontal Scaling (Multiple Instances)**: If you need to scale to multiple API containers:
  - Need shared message broker (Redis Pub/Sub or RabbitMQ) for broadcasting
  - WebSocket connections are per-instance, so clients connect to specific instance
  - For broadcast, publish to message broker, all instances receive and forward to their connected clients
- **For most deployments**: Single container is optimal and sufficient

**No Docker Changes Required:**
- Current `docker-compose.yml` and `Dockerfile` work as-is
- No additional services or containers needed
- WebSocket endpoint will be available at `ws://api:8000/ws/sync/{cash_register_id}`

**Option B: Server-Sent Events (SSE)**
- Simpler implementation, one-way communication
- Endpoint: `GET /api/v1/sync/events?cash_register_id={id}`
- Less efficient for high-frequency updates

**Option C: Polling with Long Polling**
- Fallback if WebSocket/SSE not available
- Client polls `/api/v1/sync/check?since={timestamp}` periodically
- Returns list of changed entities since timestamp

#### 1.4 Notification Triggers
- **Product Updates**: When product price, name, image, or other fields change
- **Category Updates**: When category name or description changes
- **Material Updates**: When material cost or details change
- **Settings Updates**: When global or store settings change
- **Table Updates**: When table status or configuration changes
- **Inventory Config Updates**: When inventory control config changes

**Implementation**: Add hooks/triggers in model update methods or use SQLAlchemy events

### 2. Client-Side Components

#### 2.1 Sync State Tracking
Store last sync timestamp for each entity type in IndexedDB:
- New store: `sync_state`
  - Key: entity_type (e.g., "products", "categories")
  - Value: { entity_type, last_sync_timestamp, sync_version }

#### 2.2 Incremental Sync Service
Create `frontend/pos/src/services/incrementalSync.ts`:
- `performIncrementalSync(entityType, sinceTimestamp)` - Sync specific entity type
  - **MUST be silent**: No toasts, only update SyncContext state
  - **MUST be non-blocking**: Never throw errors that interrupt POS operations
  - **MUST handle errors gracefully**: Log errors, update sync state, continue with other entities
- `performFullIncrementalSync()` - Sync all entity types that have updates
  - Runs silently in background
  - Updates sync state on completion/failure
  - Never shows toast notifications
- `checkForUpdates()` - Check if updates are available
- Track sync state and update timestamps
- Integrate with existing `SyncContext` for state management

#### 2.3 WebSocket/SSE Client
- Connect to server WebSocket/SSE endpoint on app startup
- Listen for update notifications
- Trigger incremental sync when notification received (silently in background)
- Handle reconnection automatically
- **CRITICAL**: Sync triggered by notifications must be silent (no toasts)
- Update sync state only (triggers bottom bar indicator if errors occur)

#### 2.4 Online/Reconnection Handler
- When app comes online:
  1. Check last sync timestamp for each entity type
  2. Query server for updates since last sync
  3. Perform incremental sync for all changed entities (silently in background)
  4. Update sync state (triggers bottom bar indicator if needed)
  5. **CRITICAL**: No toast notifications, no blocking operations
  6. Operator can continue working while sync happens in background

#### 2.5 Image Sync Updates
- When product image update notification received:
  - Download new image (size 110) silently in background
  - Replace existing image in IndexedDB
  - Update ProductTile display automatically
  - **CRITICAL**: If image download fails, log error silently, no toast notification
  - Update sync state if persistent failures occur (triggers bottom bar indicator)

### 3. Implementation Steps

#### Phase 1: Backend - Incremental Sync Endpoints
1. Create `backend/app/api/v1/sync.py` router
2. Implement incremental sync endpoints for each entity type
3. Add `since` timestamp parameter filtering
4. Return only changed records (updated_at > since)
5. Include deleted records tracking (soft delete or separate endpoint)

#### Phase 2: Backend - Real-Time Notifications
1. Implement WebSocket endpoint in FastAPI
2. Create notification service to broadcast changes
3. Add hooks in model update methods to trigger notifications
4. Test with multiple connected clients

#### Phase 3: Frontend - Sync State Management
1. Create `sync_state` IndexedDB store
2. Update initial sync to record sync timestamps
3. Create sync state query/update utilities

#### Phase 4: Frontend - Incremental Sync Service
1. Create `incrementalSync.ts` service
2. Implement sync functions for each entity type
3. **CRITICAL**: All sync operations must be silent (no toasts, only update sync state)
4. Integrate with existing sync infrastructure (SyncContext)
5. Handle image updates for products
6. Update sync state/context on errors (triggers bottom bar indicator)
7. Never throw errors that would interrupt POS operations

#### Phase 5: Frontend - Real-Time Client
1. Create WebSocket/SSE client
2. Connect on app startup
3. Handle notifications and trigger syncs
4. Implement reconnection logic

#### Phase 6: Frontend - Reconnection Handler
1. Enhance online event handler
2. Check for updates on reconnection
3. Perform incremental sync automatically (silently in background)
4. **CRITICAL**: Update bottom bar indicator only, NO toast notifications
5. Operator can check sync status via bottom bar when convenient

### 4. Data Flow

#### Initial Sync (First Time)
```
1. Client performs full initial sync
2. Record sync timestamp for each entity type
3. Store in sync_state IndexedDB store
```

#### Incremental Sync (After Initial)
```
1. Client receives notification OR checks for updates
2. Get last sync timestamp for entity type
3. Call incremental sync endpoint with since parameter
4. Server returns only changed records
5. Client updates local IndexedDB
6. Update sync timestamp
7. If product image changed, download new image
```

#### Real-Time Update Flow
```
1. Admin updates product in console app
2. Backend saves change and triggers notification
3. WebSocket broadcasts to all connected POS clients
4. POS client receives notification
5. Client triggers incremental sync for that entity type
6. Local data updated, UI refreshed
```

### 5. Entity Types to Sync Incrementally

All entities synced during initial sync:
- ✅ Products (including images)
- ✅ Categories
- ✅ Materials
- ✅ Unit of Measures
- ✅ Product Unit of Measures
- ✅ Material Unit of Measures
- ✅ Recipes
- ✅ Recipe Materials
- ✅ Settings
- ✅ Tables (store-specific)
- ✅ Inventory Control Config (store-specific)
- ✅ Document Prefixes (store-specific)

### 6. Error Handling

**CRITICAL: Non-Blocking, Silent Sync**
- **No Toast Notifications**: Sync errors must NEVER show toast messages that interrupt the operator
- **Visual Indicator Only**: Use existing BottomBar sync failure indicator (already implemented)
- **Background Operation**: All sync operations run silently in the background
- **Operator Control**: Operator can check sync status via bottom bar indicator when convenient

**Error Handling Strategy:**
- **Network Errors**: Queue sync for retry when online, update bottom bar indicator
- **Partial Failures**: Continue syncing other entity types, log errors silently
- **Version Conflicts**: Use timestamp-based resolution (server wins), no user notification
- **Missing Images**: Download on-demand if sync succeeds but image download fails, no error shown
- **Authentication Errors**: Update bottom bar indicator, allow operator to re-authenticate when ready
- **Sync Failures**: Update bottom bar sync error indicator, operator can view details when convenient

**Bottom Bar Indicators (Already Implemented):**
- ✅ Online/Offline status indicator
- ✅ Sync error button (shows when sync fails)
- ✅ Sync auth failure button (shows when authentication fails)
- ✅ Pending sync count
- ✅ "Sync Now" button for manual trigger

**Implementation Requirements:**
1. All sync operations must be wrapped in try-catch blocks
2. Errors must update sync state/context, NOT show toasts
3. BottomBar component already listens to sync state and displays indicators
4. Operator can click indicators to view details or retry when convenient
5. Sync must never block or delay POS operations

### 7. Performance Considerations

- **Batch Updates**: Sync multiple entity types in parallel
- **Rate Limiting**: Limit sync frequency to avoid server overload
- **Selective Sync**: Only sync entity types that have updates
- **Image Optimization**: Only download images that actually changed
- **Connection Management**: Reuse WebSocket connection, implement heartbeat
- **Non-Blocking**: All sync operations must run asynchronously without blocking UI
- **Low Priority**: Sync operations should not interfere with POS operations (use requestIdleCallback or similar)
- **Background Processing**: Sync should happen when system is idle or during natural breaks

### 8. Testing Strategy

- **Unit Tests**: Incremental sync logic, timestamp filtering
- **Integration Tests**: WebSocket notifications, sync endpoints
- **E2E Tests**: Full sync flow with multiple clients
- **Offline/Online Tests**: Reconnection scenarios

### 9. Future Enhancements

- **Conflict Resolution**: Handle concurrent edits
- **Compression**: Compress sync payloads for large datasets
- **Delta Sync**: Only sync changed fields, not entire records
- **Sync Analytics**: Track sync performance and failures
- **Manual Sync Trigger**: Allow users to manually trigger sync

## Implementation Priority

1. **High Priority**: Products, Categories (most frequently updated)
2. **Medium Priority**: Materials, Settings, Tables
3. **Low Priority**: Recipes, Unit of Measures (rarely change)

## Technical Decisions

### WebSocket vs SSE vs Polling
- **Recommendation**: WebSocket for real-time, with polling fallback
- WebSocket provides bidirectional communication and lower latency
- Polling as fallback for environments where WebSocket is blocked

### Timestamp vs Version Numbers
- **Recommendation**: Timestamps (already in place)
- Simpler implementation, works with existing `updated_at` fields
- Version numbers would require additional tracking

### Single vs Multiple Endpoints
- **Recommendation**: Single endpoint with entity_type parameter
- Reduces code duplication
- Easier to maintain and extend

