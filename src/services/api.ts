import axios from 'axios';
import { Circle, CircleMember, Message, ApiResponse, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  console.log('API Request - URL:', config.url);
  console.log('API Request - Token exists:', !!token);
  if (token) {
    console.log('API Request - Token (first 20 chars):', token.substring(0, 20) + '...');
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('API Request - No token found in localStorage');
  }
  return config;
});

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('API Response Error - Status:', error.response?.status);
    console.log('API Response Error - Message:', error.response?.data?.message);
    console.log('API Response Error - URL:', error.config?.url);
    
    if (error.response?.status === 401) {
      console.log('API Response Error - 401 Unauthorized, clearing tokens and redirecting to login');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API - Updated to match backend endpoints
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: { name: string; email: string; password: string }): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Circles API - Updated to match backend endpoints exactly
export const circlesAPI = {
  getAllCircles: async (): Promise<ApiResponse<Circle[]>> => {
    const response = await api.get('/circles');
    return response.data;
  },

  getCircleDetails: async (circleId: string): Promise<ApiResponse<Circle>> => {
    const response = await api.get(`/circles/${circleId}`);
    return response.data;
  },

  getCircleMembers: async (circleId: string): Promise<ApiResponse<CircleMember[]>> => {
    const response = await api.get(`/circles/${circleId}/members`);
    return response.data;
  },

  joinCircle: async (circleId: string): Promise<ApiResponse<CircleMember>> => {
    const response = await api.post('/circles/join', { circleId });
    return response.data;
  },

  leaveCircle: async (circleId: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/circles/leave', { circleId });
    return response.data;
  },

  getMessages: async (circleId: string, limit = 50, offset = 0): Promise<ApiResponse<Message[]>> => {
    const response = await api.get(`/circles/messages?circleId=${circleId}&limit=${limit}&offset=${offset}`);
    return response.data;
  },

  createMessage: async (circleId: string, content: string): Promise<ApiResponse<Message>> => {
    const response = await api.post('/circles/messages', { circleId, content });
    return response.data;
  },
};

export default api;

// Utility function to check authentication status
export const checkAuthStatus = () => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  
  console.log('Auth Status Check:');
  console.log('- Token exists:', !!token);
  console.log('- User data exists:', !!user);
  
  if (token) {
    console.log('- Token (first 20 chars):', token.substring(0, 20) + '...');
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('- User email:', userData.email);
    } catch (error) {
      console.log('- User data is invalid JSON');
    }
  }
  
  return {
    hasToken: !!token,
    hasUser: !!user,
    token: token,
    user: user ? JSON.parse(user) : null
  };
}; 