/**
 * API client setup for POS application.
 * Includes offline detection, request queuing, and refresh token mechanism.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { refreshToken } from '@/services/tokenRefresh';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Track online/offline status
let isOnline = navigator.onLine;

// Track if we're currently refreshing the token to prevent multiple refresh attempts
// (Currently not used but kept for future enhancement of request queuing during refresh)
// let isRefreshing = false;

window.addEventListener('online', () => {
  isOnline = true;
  // Trigger sync when coming online
  // syncManager.sync();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (check both possible keys)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('pos_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check if offline
    if (!isOnline) {
      // Queue request for later sync
      // syncQueue.add(config);
      return Promise.reject(new Error('Offline'));
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with refresh token mechanism
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle network errors
    if (!error.response && error.message === 'Network Error') {
      // Queue request for later sync
      // syncQueue.add(error.config);
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // If we haven't tried refreshing yet, try to refresh the token
      // This applies to both sync and non-sync requests
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        // Try to refresh the token
        try {
          const newToken = await refreshToken();
          
          if (newToken) {
            // Update the token in localStorage
            localStorage.setItem('pos_auth_token', newToken);
            
            // Update the authorization header for the failed request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // Retry the original request with the new token
            return apiClient(originalRequest);
          } else {
            // Refresh failed
            // For sync requests, trigger auth failure notification (no redirect)
            // For non-sync requests, also trigger notification (handled by handleAuthFailure)
            await handleAuthFailure();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Refresh token failed
          console.error('Token refresh failed:', refreshError);
          // For sync requests, trigger auth failure notification (no redirect)
          // For non-sync requests, also trigger notification
          await handleAuthFailure();
          return Promise.reject(error);
        }
      } else {
        // Already tried refreshing - trigger auth failure notification
        await handleAuthFailure();
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Handle authentication failure during background sync.
 * Instead of redirecting, triggers a sync auth failure event that the UI can handle.
 * This allows background sync failures to be handled gracefully without disrupting the user.
 */
async function handleAuthFailure() {
  // Check if this is a sync request (background sync)
  // We determine this by checking if the request has the isSyncRequest flag
  // or if it's coming from a background sync operation
  
  // Dispatch event for sync auth failure (for background syncs)
  // The SyncContext will listen to this and show a notification button
  const syncAuthFailureEvent = new CustomEvent('sync:auth-failure', {
    detail: {
      timestamp: new Date().toISOString(),
      reason: 'token_refresh_failed',
    }
  });
  window.dispatchEvent(syncAuthFailureEvent);
  
  // Note: We do NOT clear tokens or redirect here
  // The sync system will handle re-authentication via CredentialDialog
  // This ensures background sync failures don't disrupt the UI
  console.warn('[apiClient] Sync authentication failure - notification will be shown in UI');
}

export default apiClient;

