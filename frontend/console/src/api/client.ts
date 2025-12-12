/**
 * API client setup for Console application.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Always use VITE_API_URL if it exists, otherwise use appropriate default
// In dev mode without VITE_API_URL, use empty string (handled by Vite proxy)
// In prod mode without VITE_API_URL, use default localhost:8001
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || 'http://localhost:8001'
  : '';

console.log('API_CLIENT', API_BASE_URL);
// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('INTERCEPTOR REQUEST', config, API_BASE_URL);
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Log error details for debugging
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error - No Response:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    } else {
      // Error setting up the request
      console.error('API Error - Request Setup:', error.message);
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      localStorage.removeItem('auth_token');
      
      // Only redirect if we're not already on the login page
      // This prevents infinite redirect loops
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/login/') {
        // Use window.location.replace to avoid adding to history and prevent back button issues
        window.location.replace('/login');
      }
      // If already on login page, just clear the token (no redirect needed)
    } else if (error.response?.status === 503) {
      // Service Unavailable - API might be starting up or database connection issue
      console.error('API Service Unavailable (503). Check if API server is running and database is accessible.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

