import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for your backend API
// For React Native (Android emulator)
const BASE_URL_ANDROID = 'http://10.0.2.2:3000';

// For web interface
const BASE_URL_WEB = 'http://localhost:3000';

// For production
const BASE_URL_PRODUCTION = 'http://your-backend-url.com';

// Select the appropriate base URL based on platform
const BASE_URL = typeof window !== 'undefined' ? BASE_URL_WEB : BASE_URL_ANDROID;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.log('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/api/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // Get current user profile
  getCurrentUser: () => api.get('/api/auth/me'),
};

// User API calls
export const userAPI = {
  // Get user profile
  getProfile: () => api.get('/api/users/profile'),
  
  // Update user profile
  updateProfile: (profileData) => api.put('/api/users/profile', profileData),
  
  // Change password
  changePassword: (passwordData) => api.put('/api/users/change-password', passwordData),
};

// Ride API calls
export const rideAPI = {
  // Create new ride
  createRide: (rideData) => api.post('/api/rides', rideData),
  
  // Get user's rides
  getUserRides: (params = {}) => api.get('/api/rides/my-rides', { params }),
  
  // Get specific ride by ID
  getRideById: (rideId) => api.get(`/api/rides/${rideId}`),
  
  // Update ride
  updateRide: (rideId, rideData) => api.put(`/api/rides/${rideId}`, rideData),
  
  // Cancel ride
  cancelRide: (rideId) => api.delete(`/api/rides/${rideId}`),
};

// Admin API calls
export const adminAPI = {
  // Get all rides with filters
  getAllRides: (params = {}) => api.get('/api/admin/rides', { params }),
  
  // Approve/reject ride
  updateRideStatus: (rideId, action, reason) => api.post(`/api/admin/rides/${rideId}/action`, { action, reason }),
  
  // Get analytics
  getAnalytics: (params = {}) => api.get('/api/admin/analytics', { params }),
  
  // Get dashboard statistics
  getDashboard: () => api.get('/api/admin/dashboard'),
};

// Simulation API calls
export const simulationAPI = {
  // Get rides eligible for completion simulation
  getEligibleRides: () => api.get('/api/simulation/rides/eligible-for-completion'),
  
  // Simulate completion of a single ride
  completeRide: (rideId, reason) => api.post(`/api/simulation/rides/${rideId}/complete`, { reason }),
  
  // Bulk simulate completion of multiple rides
  bulkCompleteRides: (rideIds, reason) => api.post('/api/simulation/rides/bulk-complete', { rideIds, reason }),
};

export default api; 