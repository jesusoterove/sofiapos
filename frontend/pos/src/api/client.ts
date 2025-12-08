/**
 * API client setup for POS application.
 * Includes offline detection and request queuing.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response && error.message === 'Network Error') {
      // Queue request for later sync
      // syncQueue.add(error.config);
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Check if this is a sync request (by checking config metadata)
      const isSyncRequest = error.config?.metadata?.isSyncRequest === true;
      
      if (!isSyncRequest) {
        // Only redirect to login for non-sync requests
        // Sync requests should handle 401 errors gracefully (they'll try refresh token)
        // Use a flag to prevent multiple redirects
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('pos_auth_token');
          localStorage.removeItem('pos_refresh_token');
          // Use replace to prevent back button issues
          window.location.replace('/login');
        }
      }
      // For sync requests, just reject the promise so sync can handle it (try refresh token)
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

