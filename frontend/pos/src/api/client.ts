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
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
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
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

