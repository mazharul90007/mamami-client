import { WebSocketMessage } from '../types';
import tokenUtils from '../utils/tokenUtils';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2; // Reduced to prevent server overload
  private reconnectDelay = 5000; // Increased delay
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private isAuthenticated = false;
  private authenticationPromise: Promise<void> | null = null;
  private isConnecting = false;

  constructor(private baseUrl: string = process.env.REACT_APP_WS_URL || 'ws://localhost:5009') {
    // Log the WebSocket URL being used
    console.log('WebSocket will connect to:', this.baseUrl);
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.isConnecting) {
          console.log('WebSocket connection already in progress');
          resolve();
          return;
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log('WebSocket already connected');
          resolve();
          return;
        }
        
        this.isConnecting = true;
        console.log('Connecting to WebSocket at:', this.baseUrl);
        
        // Validate token before connecting
        console.log('Validating token...');
        tokenUtils.debugToken(token);
        
        if (!tokenUtils.isValidToken(token)) {
          const error = new Error('Invalid or expired token');
          console.error('Token validation failed:', error);
          this.isConnecting = false;
          reject(error);
          return;
        }

        console.log('✅ Token is valid, attempting WebSocket connection...');
        
        // Create WebSocket connection
        this.ws = new WebSocket(this.baseUrl);

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error('WebSocket connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout - server may not be running'));
          }
        }, 15000); // Increased to 15 seconds

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected successfully, sending authentication...');
          this.reconnectAttempts = 0;
          
          // Send authentication message immediately after connection
          const authMessage = {
            type: 'authenticate',
            token: token
          };
          
          
          this.send(authMessage);
          
          // Wait for authentication response
          this.authenticationPromise = new Promise((authResolve, authReject) => {
            const authTimeout = setTimeout(() => {
              console.error('❌ Authentication timeout after 15 seconds');
              authReject(new Error('Authentication timeout - server may not be responding'));
            }, 15000); // Increased to 15 seconds

            const authHandler = (message: any) => {
              if (message.type === 'authenticated') {
                clearTimeout(authTimeout);
                this.isAuthenticated = true;
                console.log('✅ WebSocket authenticated successfully');
                authResolve();
              } else if (message.type === 'error' && message.field === 'auth') {
                clearTimeout(authTimeout);
                console.error('❌ Authentication failed:', message);
                authReject(new Error(message.message || 'Authentication failed'));
              }
            };

            // Add temporary auth handler
            this.on('authenticated', authHandler);
            this.on('error', authHandler);

            // Clean up after authentication
            setTimeout(() => {
              this.off('authenticated', authHandler);
              this.off('error', authHandler);
            }, 6000);
          });

          this.authenticationPromise
            .then(() => {
              this.isConnecting = false;
              resolve();
            })
            .catch((error) => {
              console.error('Authentication failed:', error);
              this.isConnecting = false;
              reject(error);
            });
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            // Message received
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isAuthenticated = false;
          this.isConnecting = false;
          
          // Only attempt reconnection if it wasn't a deliberate close and we haven't maxed out
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnect();
          } else if (event.code !== 1000) {
            console.log('WebSocket disconnected but max reconnection attempts reached - using HTTP API fallback');
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          console.error('WebSocket URL attempted:', this.baseUrl);
          this.isConnecting = false;
          reject(new Error(`WebSocket connection failed - make sure backend server is running on port 5009`));
        };

      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Exponential backoff to prevent server overload
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Waiting ${delay}ms before reconnection attempt...`);
      
      setTimeout(() => {
        const token = localStorage.getItem('accessToken');
        if (token && tokenUtils.isValidToken(token)) {
          this.connect(token).catch((error) => {
            console.error('Reconnection failed:', error);
            // If authentication fails, stop trying to reconnect
            if (error.message.includes('Authentication failed') || error.message.includes('Invalid token')) {
              console.error('Authentication failed, stopping reconnection attempts');
              this.reconnectAttempts = this.maxReconnectAttempts;
            }
          });
        } else {
          console.error('No valid token found, stopping reconnection attempts');
          this.reconnectAttempts = this.maxReconnectAttempts;
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached - will rely on HTTP API fallback');
      // Don't emit error, just log - HTTP API fallback will handle messaging
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000); // Normal closure
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.messageHandlers.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Stop reconnection attempts
  }

  // Public method to check if WebSocket is authenticated
  isConnected(): boolean {
    return this.isAuthenticated && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Public method to reset connection state (useful for manual reconnection)
  resetConnectionState(): void {
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    console.log('WebSocket connection state reset');
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Handling message
    
    // Handle different message structures from backend
    if (message.type === 'authenticated') {
      console.log('✅ Authentication confirmed');
      const handlers = this.messageHandlers.get('authenticated');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    if (message.type === 'new-message') {
      const handlers = this.messageHandlers.get('new-message');
      if (handlers) {
        const messageData = message.data || message.message || message;
        handlers.forEach(handler => handler(messageData));
      }
      return;
    }

    if (message.type === 'joined-circle') {
      const handlers = this.messageHandlers.get('joined-circle');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'left-circle') {
      const handlers = this.messageHandlers.get('left-circle');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'message-sent') {
      const handlers = this.messageHandlers.get('message-sent');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'new-direct-message') {
      const handlers = this.messageHandlers.get('new-direct-message');
      if (handlers) {
        const messageData = message.data || message.message || message;
        handlers.forEach(handler => handler(messageData));
      }
      return;
    }

    if (message.type === 'direct-message-sent') {
      const handlers = this.messageHandlers.get('direct-message-sent');
      if (handlers) {
        handlers.forEach(handler => handler(message.message || message.data || message));
      }
      return;
    }

    if (message.type === 'friend-request-received') {
      const handlers = this.messageHandlers.get('friend-request-received');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'friend-request-accepted') {
      const handlers = this.messageHandlers.get('friend-request-accepted');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'friend-request-rejected') {
      const handlers = this.messageHandlers.get('friend-request-rejected');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'friend-removed') {
      const handlers = this.messageHandlers.get('friend-removed');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'user-typing') {
      console.log('⌨️ User typing event:', message);
      const handlers = this.messageHandlers.get('user-typing');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    // Audio Call Message Handlers
    if (message.type === 'call-initiated') {
      console.log('📞 Call initiated:', message);
      const handlers = this.messageHandlers.get('call-initiated');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    if (message.type === 'incoming-call') {
      console.log('📞 Incoming call:', message);
      const handlers = this.messageHandlers.get('incoming-call');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'call-accepted') {
      console.log('✅ Call accepted:', message);
      const handlers = this.messageHandlers.get('call-accepted');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    if (message.type === 'call-rejected') {
      console.log('❌ Call rejected:', message);
      const handlers = this.messageHandlers.get('call-rejected');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    if (message.type === 'call-ended') {
      console.log('📞 Call ended:', message);
      const handlers = this.messageHandlers.get('call-ended');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    if (message.type === 'call-missed') {
      console.log('📞 Call missed:', message);
      const handlers = this.messageHandlers.get('call-missed');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    if (message.type === 'error') {
      console.error('❌ WebSocket error message:', message);
      const handlers = this.messageHandlers.get('error');
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      return;
    }

    // Generic handler for other message types
    console.log('📝 Generic message handler for type:', message.type);
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data || message));
    } else {
      console.log('⚠️ No handlers found for message type:', message.type);
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // Convenience methods for common operations - Updated to match backend message types

  sendMessage(circleId: string, content: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send message: not authenticated');
      return;
    }
    const message = {
      type: 'send-message',
      circleId: circleId,
      content: content
    };
    this.send(message);
  }

  sendDirectMessage(receiverId: string, content: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send direct message: not authenticated');
      return;
    }
    console.log('💬 Sending direct message to:', receiverId, 'Content:', content);
    const message = {
      type: 'send-direct-message',
      receiverId: receiverId,
      content: content
    };
    this.send(message);
  }

  sendVoiceDirectMessage(receiverId: string, voiceData: string, fileName: string, duration?: number) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send voice message: not authenticated');
      return;
    }
    console.log('🎤 Sending voice message to:', receiverId, 'duration:', duration);
    const message = {
      type: 'send-direct-message',
      receiverId: receiverId,
      messageType: 'VOICE',
      voiceData: voiceData,
      fileName: fileName,
      duration: duration
    };
    this.send(message);
  }

  sendTyping(circleId: string, isTyping: boolean) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send typing indicator: not authenticated');
      return;
    }
    const message = {
      type: 'typing',
      circleId: circleId,
      isTyping: isTyping
    };
    this.send(message);
  }

  sendFriendRequest(receiverId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send friend request: not authenticated');
      return;
    }
    console.log('👥 Sending friend request to:', receiverId);
    const message = {
      type: 'send-friend-request',
      receiverId: receiverId
    };
    this.send(message);
  }

  acceptFriendRequest(requestId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot accept friend request: not authenticated');
      return;
    }
    console.log('✅ Accepting friend request:', requestId);
    const message = {
      type: 'accept-friend-request',
      requestId: requestId
    };
    this.send(message);
  }

  rejectFriendRequest(requestId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot reject friend request: not authenticated');
      return;
    }
    console.log('❌ Rejecting friend request:', requestId);
    const message = {
      type: 'reject-friend-request',
      requestId: requestId
    };
    this.send(message);
  }

  removeFriend(friendId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot remove friend: not authenticated');
      return;
    }
    console.log('👋 Removing friend:', friendId);
    const message = {
      type: 'remove-friend',
      friendId: friendId
    };
    this.send(message);
  }

  // Circle Management Methods
  joinCircle(circleId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot join circle: not authenticated');
      return;
    }
    console.log('👥 Joining circle:', circleId);
    const message = {
      type: 'join-circle',
      circleId: circleId
    };
    this.send(message);
  }

  leaveCircle(circleId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot leave circle: not authenticated');
      return;
    }
    console.log('👋 Leaving circle:', circleId);
    const message = {
      type: 'leave-circle',
      circleId: circleId
    };
    this.send(message);
  }

  // Audio Call Methods
  initiateCall(receiverId: string) {
    console.log('🔧 WebSocketService: initiateCall called with receiverId:', receiverId);
    console.log('🔧 WebSocketService: isAuthenticated:', this.isAuthenticated);
    console.log('🔧 WebSocketService: ws readyState:', this.ws?.readyState);
    
    if (!this.isAuthenticated) {
      console.error('❌ Cannot initiate call: not authenticated');
      return;
    }
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot initiate call: WebSocket not connected');
      return;
    }
    
    console.log('📞 Initiating call to:', receiverId);
    const message = {
      type: 'initiate-call',
      receiverId: receiverId
    };
    console.log('📤 Sending call message:', message);
    this.send(message);
  }

  acceptCall(callId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot accept call: not authenticated');
      return;
    }
    console.log('✅ Accepting call:', callId);
    const message = {
      type: 'accept-call',
      callId: callId
    };
    this.send(message);
  }

  rejectCall(callId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot reject call: not authenticated');
      return;
    }
    console.log('❌ Rejecting call:', callId);
    const message = {
      type: 'reject-call',
      callId: callId
    };
    this.send(message);
  }

  endCall(callId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot end call: not authenticated');
      return;
    }
    console.log('📞 Ending call:', callId);
    const message = {
      type: 'end-call',
      callId: callId
    };
    this.send(message);
  }
}

export default WebSocketService; 