/**
 * WebSocket client for real-time sync notifications.
 * Connects to the backend WebSocket endpoint and triggers incremental syncs.
 */
import { getRegistration } from '../utils/registration'

export interface WebSocketMessage {
  type: 'connected' | 'entity_updated' | 'pong' | 'error'
  entity_type?: string
  entity_id?: number
  change_type?: 'create' | 'update' | 'delete'
  timestamp?: string
  message?: string
  cash_register_id?: number
  store_id?: number
}

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface WebSocketClientCallbacks {
  onStatusChange?: (status: WebSocketStatus) => void
  onEntityUpdate?: (entityType: string, entityId: number, changeType: string) => void
  onError?: (error: Error) => void
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private status: WebSocketStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 3000 // Start with 3 seconds (was 1 second - too fast)
  private maxReconnectDelay = 60000 // Max 60 seconds (was 30 seconds)
  private pingInterval?: NodeJS.Timeout
  private reconnectTimeout?: NodeJS.Timeout
  private callbacks: WebSocketClientCallbacks = {}
  private cashRegisterId: number | null = null
  private shouldReconnect = true

  constructor(callbacks?: WebSocketClientCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks
    }
  }

  /**
   * Connect to the WebSocket server.
   */
  async connect(): Promise<void> {
    // Get cash register ID from registration
    console.log('[WebSocketClient] Attempting to connect to WebSocket server...')
    const registration = getRegistration()
    if (!registration?.cashRegisterId) {
      console.warn('[WebSocketClient] No cash register ID found, cannot connect')
      return
    }

    this.cashRegisterId = registration.cashRegisterId

    // Don't connect if already connected or connecting
    if (this.status === 'connected' || this.status === 'connecting') {
      return
    }

    await this.doConnect()
  }

  /**
   * Internal connect method.
   */
  private async doConnect(): Promise<void> {
    if (!this.cashRegisterId) {
      console.warn('[WebSocketClient] ⚠️ Cannot connect: No cash register ID available')
      return
    }

    this.setStatus('connecting')

    try {
      // Get API base URL
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'
      // Convert HTTP/HTTPS to WS/WSS
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/api/v1/sync/ws/${this.cashRegisterId}`

      console.log('[WebSocketClient] 🔌 Attempting to connect to WebSocket server...')
      console.log('[WebSocketClient] Connection details:', {
        url: wsUrl,
        cashRegisterId: this.cashRegisterId,
        apiBaseUrl: API_BASE_URL,
        currentStatus: this.status,
        reconnectAttempt: this.reconnectAttempts,
      })

      this.ws = new WebSocket(wsUrl)
      
      console.log('[WebSocketClient] WebSocket instance created, waiting for connection...')

      this.ws.onopen = (event) => {
        console.log('[WebSocketClient] ✅ Successfully connected to WebSocket server!')
        console.log('[WebSocketClient] Connection response:', {
          url: wsUrl,
          cashRegisterId: this.cashRegisterId,
          readyState: this.ws?.readyState,
          protocol: this.ws?.protocol || 'none',
          extensions: this.ws?.extensions || 'none',
        })
        console.log('[WebSocketClient] Open event:', {
          type: event.type,
          target: event.target,
          timeStamp: event.timeStamp,
        })
        this.setStatus('connected')
        // Reset reconnection state on successful connection
        this.reconnectAttempts = 0
        this.reconnectDelay = 3000
        this.startPingInterval()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('[WebSocketClient] 📥 Received message:', JSON.stringify(message, null, 2))
          this.handleMessage(message)
        } catch (error) {
          console.error('[WebSocketClient] ❌ Error parsing message:', error)
          console.error('[WebSocketClient] Raw message data:', event.data)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocketClient] ❌ WebSocket connection error occurred')
        console.error('[WebSocketClient] Error event:', {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget,
          timeStamp: error.timeStamp,
        })
        console.error('[WebSocketClient] Connection attempt details:', {
          url: wsUrl,
          cashRegisterId: this.cashRegisterId,
          readyState: this.ws?.readyState,
          status: this.status,
        })
        this.callbacks.onError?.(new Error('WebSocket connection error'))
      }

      this.ws.onclose = (event) => {
        console.log('[WebSocketClient] 🔌 Connection closed')
        console.log('[WebSocketClient] Close event details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        })
        this.setStatus('disconnected')
        this.stopPingInterval()
        
        // Clean up the WebSocket reference
        this.ws = null

        // Attempt to reconnect if we should
        // Code 1006 indicates abnormal closure - still try to reconnect
        if (this.shouldReconnect) {
          if (event.code === 1006) {
            console.warn('[WebSocketClient] ⚠️ Abnormal closure (1006) - connection dropped without close frame')
          }
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('[WebSocketClient] Error connecting:', error)
      this.setStatus('disconnected')
      this.callbacks.onError?.(error as Error)

      // Schedule reconnect
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Handle incoming WebSocket messages.
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log(`[WebSocketClient] 🔄 Handling message type: ${message.type}`)
    
    switch (message.type) {
      case 'connected':
        console.log('[WebSocketClient] ✅ Connection confirmed:', message.message)
        console.log(`[WebSocketClient] Store ID: ${message.store_id}, Cash Register ID: ${message.cash_register_id}`)
        break

      case 'entity_updated':
        if (message.entity_type && message.entity_id && message.change_type) {
          console.log(
            `[WebSocketClient] 🔔 Entity updated notification: ${message.entity_type} #${message.entity_id} (${message.change_type})`
          )
          console.log(`[WebSocketClient] Timestamp: ${message.timestamp}`)
          this.callbacks.onEntityUpdate?.(message.entity_type, message.entity_id, message.change_type)
        } else {
          console.warn('[WebSocketClient] ⚠️ Invalid entity_updated message - missing fields:', message)
        }
        break

      case 'pong':
        console.log('[WebSocketClient] 💓 Received pong (heartbeat response)')
        break

      case 'error':
        console.error('[WebSocketClient] ❌ Server error:', message.message)
        this.callbacks.onError?.(new Error(message.message || 'Unknown server error'))
        break

      default:
        console.warn('[WebSocketClient] ⚠️ Unknown message type:', message.type, message)
    }
  }

  /**
   * Send a ping message to keep the connection alive.
   */
  private sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const pingMessage = { type: 'ping' }
        console.log('[WebSocketClient] 📤 Sending ping:', JSON.stringify(pingMessage))
        this.ws.send(JSON.stringify(pingMessage))
        
        // Set a timeout to detect if pong is not received
        // If no pong is received within 10 seconds, consider connection dead
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Check if we're still in the same state (no pong received)
            // This is a simple check - in production, you might want to track pong responses
            console.warn('[WebSocketClient] ⚠️ No pong received after ping, connection may be dead')
          }
        }, 10000)
      } catch (error) {
        console.error('[WebSocketClient] ❌ Error sending ping:', error)
        // If sending ping fails, connection is likely dead
        if (this.ws) {
          this.ws.close()
        }
      }
    } else {
      console.warn('[WebSocketClient] ⚠️ Cannot send ping - WebSocket not open. State:', this.ws?.readyState)
      // If WebSocket is not open but we're trying to ping, schedule reconnect
      if (this.shouldReconnect && this.status !== 'reconnecting') {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Start the ping interval (send ping every 20 seconds to keep connection alive).
   */
  private startPingInterval(): void {
    this.stopPingInterval()
    this.pingInterval = setInterval(() => {
      this.sendPing()
    }, 20000) // 20 seconds - more frequent to prevent timeouts
  }

  /**
   * Stop the ping interval.
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = undefined
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketClient] Max reconnection attempts reached')
      this.setStatus('disconnected')
      return
    }

    this.reconnectAttempts++
    // Exponential backoff: 3s, 6s, 12s, 24s, 48s, 60s (max)
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay)

    console.log(`[WebSocketClient] ⏱️ Scheduling reconnect in ${delay}ms (${(delay/1000).toFixed(1)}s) - attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    this.setStatus('reconnecting')

    this.reconnectTimeout = setTimeout(() => {
      console.log(`[WebSocketClient] 🔄 Executing reconnection attempt ${this.reconnectAttempts}`)
      this.doConnect()
    }, delay)
  }

  /**
   * Update callbacks.
   */
  public updateCallbacks(callbacks: WebSocketClientCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Set the connection status and notify callbacks.
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      const previousStatus = this.status
      this.status = status
      console.log(`[WebSocketClient] 🔄 Status changed: ${previousStatus} → ${status}`)
      this.callbacks.onStatusChange?.(status)
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.shouldReconnect = false
    this.stopPingInterval()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.setStatus('disconnected')
  }

  /**
   * Get the current connection status.
   */
  getStatus(): WebSocketStatus {
    return this.status
  }

  /**
   * Check if the WebSocket is connected.
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let wsClientInstance: WebSocketClient | null = null

/**
 * Get or create the WebSocket client instance.
 */
export function getWebSocketClient(callbacks?: WebSocketClientCallbacks): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(callbacks)
  } else if (callbacks) {
    // Update callbacks if provided
    wsClientInstance.updateCallbacks(callbacks)
  }
  return wsClientInstance
}

  /**
   * Initialize the WebSocket client and connect.
   */
export async function initWebSocketClient(callbacks?: WebSocketClientCallbacks): Promise<WebSocketClient> {
  console.log('[WebSocketClient] Initializing WebSocket client...')
  const client = getWebSocketClient(callbacks)
  
  // Only connect if not already connected or connecting
  if (client.getStatus() === 'disconnected') {
    await client.connect()
  } else {
    console.log(`[WebSocketClient] Already ${client.getStatus()}, skipping connection attempt`)
  }
  
  return client
}

/**
 * Disconnect the WebSocket client.
 */
export function disconnectWebSocketClient(): void {
  if (wsClientInstance) {
    console.log('[WebSocketClient] Disconnecting WebSocket client...')
    wsClientInstance.disconnect()
    wsClientInstance = null
  }
}

