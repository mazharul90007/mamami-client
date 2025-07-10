import { WebSocketMessage } from '../types';
import tokenUtils from '../utils/tokenUtils';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private isAuthenticated = false;
  private authenticationPromise: Promise<void> | null = null;

  constructor(private baseUrl: string = 'ws://localhost:5000') {}

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to WebSocket...');
        
        // Validate token before connecting
        if (!tokenUtils.isValidToken(token)) {
          const error = new Error('Invalid or expired token');
          console.error('Token validation failed:', error);
          reject(error);
          return;
        }

        console.log('Token is valid, connecting...');
        tokenUtils.debugToken(token);
        
        this.ws = new WebSocket(`${this.baseUrl}/ws`);

        this.ws.onopen = () => {
          console.log('WebSocket connected, sending authentication...');
          this.reconnectAttempts = 0;
          
          // Send authentication message immediately after connection
          const authMessage = {
            type: 'authenticate',
            token: token
          };
          
          console.log('Sending auth message:', authMessage);
          this.send(authMessage);
          
          // Wait for authentication response
          this.authenticationPromise = new Promise((authResolve, authReject) => {
            const authTimeout = setTimeout(() => {
              authReject(new Error('Authentication timeout'));
            }, 5000);

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
            .then(() => resolve())
            .catch((error) => {
              console.error('Authentication failed:', error);
              reject(error);
            });
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isAuthenticated = false;
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isAuthenticated = false;
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        const token = localStorage.getItem('accessToken');
        if (token && tokenUtils.isValidToken(token)) {
          this.connect(token).catch(console.error);
        } else {
          console.error('Cannot reconnect: invalid or missing token');
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('🔍 Handling message:', message);
    
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
      console.log('🎉 NEW MESSAGE EVENT:', message);
      const handlers = this.messageHandlers.get('new-message');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'message-sent') {
      console.log('✅ Message sent confirmation:', message);
      const handlers = this.messageHandlers.get('message-sent');
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

    if (message.type === 'user-joined-circle') {
      console.log('👋 User joined circle:', message);
      const handlers = this.messageHandlers.get('user-joined-circle');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'user-left-circle') {
      console.log('👋 User left circle:', message);
      const handlers = this.messageHandlers.get('user-left-circle');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'joined-circle') {
      console.log('✅ Joined circle confirmation:', message);
      const handlers = this.messageHandlers.get('joined-circle');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
      }
      return;
    }

    if (message.type === 'left-circle') {
      console.log('✅ Left circle confirmation:', message);
      const handlers = this.messageHandlers.get('left-circle');
      if (handlers) {
        handlers.forEach(handler => handler(message.data || message));
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
      console.log('📤 Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket is not connected');
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
    console.log(`📝 Registered handler for event: ${event}`);
  }

  off(event: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`📝 Removed handler for event: ${event}`);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket');
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  // Convenience methods for common operations - Updated to match backend message types
  joinCircle(circleId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot join circle: not authenticated');
      return;
    }
    console.log('🔄 Joining circle:', circleId);
    const message = {
      type: 'join-circle',
      circleId: circleId
    };
    console.log('📤 Sending join circle message:', message);
    this.send(message);
  }

  leaveCircle(circleId: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot leave circle: not authenticated');
      return;
    }
    console.log('🔄 Leaving circle:', circleId);
    this.send({
      type: 'leave-circle',
      circleId: circleId
    });
  }

  sendMessage(circleId: string, content: string) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send message: not authenticated');
      return;
    }
    console.log('💬 Sending message to circle:', circleId, 'Content:', content);
    const message = {
      type: 'send-message',
      circleId: circleId,
      content: content
    };
    console.log('📤 Sending WebSocket message:', message);
    this.send(message);
  }

  sendTyping(circleId: string, isTyping: boolean) {
    if (!this.isAuthenticated) {
      console.error('❌ Cannot send typing: not authenticated');
      return;
    }
    console.log('⌨️ Sending typing indicator:', isTyping, 'for circle:', circleId);
    this.send({
      type: 'typing',
      circleId: circleId,
      isTyping: isTyping
    });
  }
}

export default WebSocketService; 