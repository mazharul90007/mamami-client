import axios from 'axios';
import { Circle, Message, DirectMessage, FriendRequest, User, Conversation, Mood, ApiResponse, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5009/api/v1';

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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.patch('/user/profile', data);
    return response.data;
  },

  getMatches: async (moods: Mood[], limit: number = 20): Promise<ApiResponse<User[]>> => {
    const moodsString = moods.join(',');
    const response = await api.get(`/user/matches?moods=${moodsString}&limit=${limit}`);
    return response.data;
  },

  requestPasswordOtp: async (email: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/request-password-otp', { email });
    return response.data;
  },

  verifyPasswordOtp: async (email: string, otp: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/verify-password-otp', { email, otp });
    return response.data;
  },

  changePassword: async (email: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/change-password', { email, newPassword });
    return response.data;
  },

  resendOtp: async (email: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/resend-otp', { email });
    return response.data;
  },

  requestResetPasswordOtp: async (email: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/request-reset-password-otp', { email });
    return response.data;
  },

  verifyResetPasswordOtp: async (email: string, otp: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/verify-reset-password-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await api.post('/user/reset-password', { email, newPassword });
    return response.data;
  },

  softDeleteUser: async (): Promise<ApiResponse<void>> => {
    const response = await api.delete('/user/profile');
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

  getMessages: async (circleId: string, limit = 50, offset = 0): Promise<ApiResponse<Message[]>> => {
    const response = await api.get(`/circles/messages?circleId=${circleId}&limit=${limit}&offset=${offset}`);
    return response.data;
  },

  createMessage: async (circleId: string, content: string): Promise<ApiResponse<Message>> => {
    const response = await api.post('/circles/messages', { circleId, content });
    return response.data;
  },
};

// Friend Request API
export const friendRequestAPI = {
  sendFriendRequest: async (receiverId: string, message?: string, voiceFile?: File): Promise<ApiResponse<FriendRequest>> => {
    const formData = new FormData();
    formData.append('receiverId', receiverId);
    if (message) {
      formData.append('message', message);
    }
    if (voiceFile) {
      formData.append('voiceMessage', voiceFile);
    }
    
    const response = await api.post('/friend-requests/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  acceptFriendRequest: async (requestId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch(`/friend-requests/${requestId}/accept`);
    return response.data;
  },

  rejectFriendRequest: async (requestId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch(`/friend-requests/${requestId}/reject`);
    return response.data;
  },

  getPendingRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await api.get('/friend-requests/pending');
    return response.data;
  },

  getSentRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await api.get('/friend-requests/sent');
    return response.data;
  },

  getFriendsList: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/friend-requests/friends');
    return response.data;
  },

  removeFriend: async (friendId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/friend-requests/friends/${friendId}`);
    return response.data;
  },
};

// Direct Message API
export const directMessageAPI = {
  sendDirectMessage: async (receiverId: string, content?: string): Promise<ApiResponse<DirectMessage>> => {
    const response = await api.post('/direct-messages/send', { 
      receiverId, 
      content 
    });
    return response.data;
  },

  getConversation: async (friendId: string, limit = 50, offset = 0): Promise<ApiResponse<DirectMessage[]>> => {
    const response = await api.get(`/direct-messages/conversation/${friendId}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  markMessagesAsRead: async (senderId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch(`/direct-messages/read/${senderId}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await api.get('/direct-messages/unread-count');
    return response.data;
  },

  getRecentConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    const response = await api.get('/direct-messages/conversations');
    return response.data;
  },
};

// Utility function to check auth status
export const checkAuthStatus = () => {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  
  return {
    hasToken: !!token,
    hasUser: !!userStr,
    user: userStr ? JSON.parse(userStr) : null,
  };
}; 