export interface User {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl?: string | null;
  gender?: 'women' | 'men' | 'nonbinary';
  interestedIn?: 'women' | 'men' | 'both';
  heightFeet?: number;
  heightInches?: number;
  birthday?: string;
  bio?: string;
  relationshipStatus?: 'single' | 'in_relationship' | 'married' | 'divorced' | 'widowed' | 'complicated';
  language?: string[];
  work?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  feelingToday?: Mood[];
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'HAPPY' | 'SAD' | 'CALM' | 'BORED' | 'ROMANTIC' | 'FRUSTRATED' | 'STRESSED' | 'GRATEFUL' | 'FLIRTY' | 'ANGRY';

export interface Circle {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



export interface Message {
  id: string;
  content: string | null;
  userId: string;
  circleId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface DirectMessage {
  id: string;
  content: string | null;
  messageType: 'TEXT' | 'VOICE';
  voiceMessageUrl?: string | null;
  duration?: number | null;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: User;
  receiver: User;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  voiceMessageUrl?: string | null;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: User;
  receiver: User;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
  user1: User;
  user2: User;
}

export interface Conversation {
  friend: User;
  lastMessage: DirectMessage;
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

// Updated WebSocket message types to match backend exactly
export interface WebSocketMessage {
  type: 'authenticate' | 'authenticated' | 'join-circle' | 'joined-circle' | 'leave-circle' | 'left-circle' | 'send-message' | 'message-sent' | 'new-message' | 'typing' | 'user-typing' | 'user-joined-circle' | 'user-left-circle' | 'send-direct-message' | 'direct-message-sent' | 'new-direct-message' | 'send-friend-request' | 'friend-request-sent' | 'friend-request-received' | 'accept-friend-request' | 'friend-request-accepted' | 'reject-friend-request' | 'friend-request-rejected' | 'remove-friend' | 'friend-removed' | 'error';
  data?: any;
  token?: string;
  circleId?: string;
  receiverId?: string;
  content?: string;
  messageType?: 'TEXT' | 'VOICE';
  voiceData?: string;
  fileName?: string;
  isTyping?: boolean;
  success?: boolean;
  message?: any;
  user?: User;
  timestamp?: string;
} 