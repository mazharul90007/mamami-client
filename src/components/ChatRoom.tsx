import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { circlesAPI } from '../services/api';
import { checkAuthStatus } from '../services/api';
import { Circle, CircleMember, Message } from '../types';
import WebSocketService from '../services/websocket';
import { Send, RefreshCw, Loader2, AlertCircle, ArrowLeft, Users, User } from 'lucide-react';

const ChatRoom: React.FC = () => {
  const { circleId } = useParams<{ circleId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (circleId) {
      console.log('ChatRoom: Component mounted with circleId:', circleId);
      
      // Debug authentication status
      const authStatus = checkAuthStatus();
      console.log('ChatRoom: Authentication status:', authStatus);
      
      fetchCircleData();
      setupWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [circleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCircleData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching circle data for circleId:', circleId);
      
      const [circleResponse, membersResponse] = await Promise.all([
        circlesAPI.getCircleDetails(circleId!),
        circlesAPI.getCircleMembers(circleId!)
      ]);

      if (circleResponse.success) {
        setCircle(circleResponse.data);
        console.log('Circle details loaded:', circleResponse.data);
      } else {
        console.error('Failed to fetch circle details:', circleResponse.message);
        setError(`Failed to load circle: ${circleResponse.message}`);
        return;
      }
      
      if (membersResponse.success) {
        setMembers(membersResponse.data);
        console.log('Circle members loaded:', membersResponse.data.length, 'members');
      } else {
        console.error('Failed to fetch members:', membersResponse.message);
      }

      // Load messages separately with better error handling
      await loadMessages();
      
    } catch (err: any) {
      console.error('Error fetching circle data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load chat data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      console.log('Loading messages for circle:', circleId);
      
      // Debug authentication before making the request
      const authStatus = checkAuthStatus();
      console.log('loadMessages: Auth status before request:', authStatus);
      
      const messagesResponse = await circlesAPI.getMessages(circleId!, 100, 0);
      
      console.log('loadMessages: Response received:', messagesResponse);
      
      if (messagesResponse.success) {
        const loadedMessages = messagesResponse.data.reverse(); // Reverse to show newest first
        setMessages(loadedMessages);
        console.log('Messages loaded successfully:', loadedMessages.length, 'messages');
        
        // Log each message for debugging
        loadedMessages.forEach((msg, index) => {
          console.log(`Message ${index + 1}: ${msg.user.name} - "${msg.content}" (${new Date(msg.createdAt).toLocaleString()})`);
        });
      } else {
        console.error('Failed to load messages:', messagesResponse.message);
        setMessages([]); // Set empty array to show "no messages" state
      }
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setMessages([]); // Set empty array to show "no messages" state
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupWebSocket = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setWsError('No authentication token found');
      return;
    }

    console.log('Setting up WebSocket connection...');
    wsRef.current = new WebSocketService();
    
    try {
      await wsRef.current.connect(token);
      setWsConnected(true);
      setWsError('');

      console.log('WebSocket connected and authenticated, joining circle...');
      
      // Join the circle
      wsRef.current.joinCircle(circleId!);

      // Set up message handlers for backend message types
      wsRef.current.on('authenticated', (data: any) => {
        console.log('WebSocket authenticated:', data);
      });

      wsRef.current.on('joined-circle', (data: any) => {
        console.log('Joined circle:', data);
      });

      wsRef.current.on('new-message', (message: Message) => {
        console.log('🎉 NEW MESSAGE RECEIVED:', message);
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            console.log('Message already exists, not adding duplicate');
            return prev;
          }
          console.log('Adding new message to chat');
          return [...prev, message];
        });
      });

      wsRef.current.on('user-typing', (data: { userId: string; circleId: string; isTyping: boolean }) => {
        console.log('User typing:', data);
        if (data.isTyping) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(data.userId);
            return Array.from(newSet);
          });
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      });

      wsRef.current.on('user-joined-circle', (data: { userId: string; circleId: string }) => {
        console.log('User joined circle:', data);
        // Refresh members list
        fetchCircleData();
      });

      wsRef.current.on('user-left-circle', (data: { userId: string; circleId: string }) => {
        console.log('User left circle:', data);
        // Refresh members list
        fetchCircleData();
      });

      wsRef.current.on('error', (data: any) => {
        console.error('WebSocket error:', data);
        const errorMessage = data.message || data.field || 'WebSocket error occurred';
        setWsError(errorMessage);
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setWsError('Failed to connect to real-time chat');
      setWsConnected(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !wsRef.current) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('Sending message:', messageContent);
      wsRef.current.sendMessage(circleId!, messageContent);
      
      // Stop typing indicator
      wsRef.current.sendTyping(circleId!, false);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      // Restore the message in input if sending failed
      setNewMessage(messageContent);
    }
  };

  const handleTyping = () => {
    if (!wsRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      wsRef.current.sendTyping(circleId!, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      wsRef.current?.sendTyping(circleId!, false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return 'Someone is typing...';
    return 'Multiple people are typing...';
  };

  const handleRefreshMessages = () => {
    loadMessages();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Circles
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{circle?.name || 'Loading...'}</h1>
              <p className="text-sm text-gray-600">{members.length} members</p>
            </div>
          </div>
          
          {/* Debug button */}
          <button
            onClick={() => {
              const authStatus = checkAuthStatus();
              console.log('Manual auth check:', authStatus);
              alert(`Auth Status:\nToken: ${authStatus.hasToken}\nUser: ${authStatus.hasUser}\nEmail: ${authStatus.user?.email || 'N/A'}`);
            }}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
          >
            Debug Auth
          </button>
          
          {/* Debug Join Circle button */}
          <button
            onClick={() => {
              if (wsRef.current && wsConnected) {
                console.log('Manually joining circle:', circleId);
                wsRef.current.joinCircle(circleId!);
              } else {
                console.log('WebSocket not connected, cannot join circle');
                alert('WebSocket not connected');
              }
            }}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
          >
            Debug Join
          </button>
          
          {/* Refresh button */}
          <button
            onClick={handleRefreshMessages}
            disabled={loadingMessages}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Refresh messages"
          >
            <RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Connection Status */}
        {!wsConnected && !wsError && (
          <div className="mt-2 text-sm text-yellow-600">
            Connecting to real-time chat...
          </div>
        )}
        
        {wsError && (
          <div className="mt-2 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            WebSocket: {wsError}
          </div>
        )}
        
        {wsConnected && !wsError && (
          <div className="mt-2 text-sm text-green-600">
            Connected to real-time chat
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
            <button
              onClick={handleRefreshMessages}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              Refresh messages
            </button>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.userId === user?.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-center mb-1">
                  <User className="h-3 w-3 mr-1" />
                  <span className="text-xs font-medium">
                    {message.user.name}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {getTypingText() && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600 italic">{getTypingText()}</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={wsConnected ? "Type a message..." : "Connecting..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={!wsConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !wsConnected}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom; 