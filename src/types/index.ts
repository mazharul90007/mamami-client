export interface User {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  isMember: boolean;
}

export interface CircleMember {
  id: string;
  userId: string;
  circleId: string;
  joinedAt: string;
  isActive: boolean;
  user: User;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  circleId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

// Updated WebSocket message types to match backend exactly
export interface WebSocketMessage {
  type: 'authenticate' | 'authenticated' | 'join-circle' | 'joined-circle' | 'leave-circle' | 'left-circle' | 'send-message' | 'message-sent' | 'new-message' | 'typing' | 'user-typing' | 'user-joined-circle' | 'user-left-circle' | 'error';
  data?: any;
  token?: string;
  circleId?: string;
  content?: string;
  isTyping?: boolean;
  success?: boolean;
  message?: any;
  user?: User;
  timestamp?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
} 