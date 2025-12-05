/**
 * API client setup for Console application.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Use relative path for API calls (handled by Vite proxy in dev)
// In production, use environment variable or default
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  : ''; // Empty string uses relative path, which Vite proxy handles

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
    }
    return Promise.reject(error);
  }
);

export default apiClient;

