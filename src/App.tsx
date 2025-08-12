import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AudioCallProvider } from './contexts/AudioCallContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import CircleList from './components/CircleList';
import ChatRoom from './components/ChatRoom';
import MoodSelection from './components/MoodSelection';
import MatchList from './components/MatchList';
import FriendManagement from './components/FriendManagement';
import ConversationList from './components/ConversationList';
import DirectMessageChat from './components/DirectMessageChat';
import AudioCallManager from './components/AudioCallManager';
import AudioCallDebug from './components/AudioCallDebug';
import { userAPI, friendRequestAPI, directMessageAPI } from './services/api';
import { User, Mood, DirectMessage } from './types';
import WebSocketService from './services/websocket';
import { 
  Home, 
  Users, 
  MessageCircle, 
  Heart, 
  LogOut,
  User as UserIcon
} from 'lucide-react';

// WebSocket Context
const WebSocketContext = createContext<WebSocketService | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

type ViewType = 
  | 'home' 
  | 'circles' 
  | 'chat' 
  | 'matches' 
  | 'friends' 
  | 'messages' 
  | 'direct-chat' 
  | 'profile'
  | 'call-test';

interface AppState {
  currentView: ViewType;
  selectedCircle: string | null;
  selectedFriend: User | null;
  matches: User[];
  friends: User[];
  showMoodSelection: boolean;
}

function App() {
  const { user, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    currentView: 'home',
    selectedCircle: null,
    selectedFriend: null,
    matches: [],
    friends: [],
    showMoodSelection: false,
  });
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      initializeWebSocket();
      loadFriends();
    } else {
      if (wsService) {
        wsService.disconnect();
        setWsService(null);
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeWebSocket = async () => {
    console.log('🔧 Initializing WebSocket...');
    if (!user) {
      console.log('❌ No user, skipping WebSocket initialization');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('❌ No token, skipping WebSocket initialization');
      return;
    }

    console.log('✅ User and token available, creating WebSocket service');
    const ws = new WebSocketService();
    
    try {
      console.log('🔌 Connecting to WebSocket...');
      await ws.connect(token);
      console.log('✅ WebSocket connected successfully');
      setWsService(ws);

      // Set WebSocket service on window for AudioCallContext to access
      (window as any).wsService = ws;

      // Set up event handlers
      console.log('📡 Setting up WebSocket event handlers');
      ws.on('new-message', handleNewMessage);
      ws.on('new-direct-message', handleNewDirectMessage);
      ws.on('friend-request-received', handleFriendRequestReceived);
      ws.on('friend-request-accepted', handleFriendRequestAccepted);
      ws.on('friend-request-rejected', handleFriendRequestRejected);
      ws.on('friend-removed', handleFriendRemoved);
      ws.on('error', handleWebSocketError);

      // Set up call event handlers
      ws.on('call-initiated', (data: any) => {
        console.log('📞 Call initiated received in App:', data);
        // This will be handled by AudioCallContext
      });
      ws.on('incoming-call', (data: any) => {
        console.log('📞 Incoming call received in App:', data);
        // This will be handled by AudioCallContext
      });
      ws.on('call-accepted', (data: any) => {
        console.log('✅ Call accepted received in App:', data);
        // This will be handled by AudioCallContext
      });
      ws.on('call-rejected', (data: any) => {
        console.log('❌ Call rejected received in App:', data);
        // This will be handled by AudioCallContext
      });
      ws.on('call-ended', (data: any) => {
        console.log('📞 Call ended received in App:', data);
        // This will be handled by AudioCallContext
      });
      ws.on('call-missed', (data: any) => {
        console.log('📞 Call missed received in App:', data);
        // This will be handled by AudioCallContext
      });

      console.log('✅ WebSocket initialization complete');

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      // Don't set wsService if connection fails - HTTP API fallback will handle messaging
      console.log('📡 Will rely on HTTP API fallback for messaging');
    }
  };

  const handleNewMessage = (message: any) => {
    // Only show notification for circle messages when not in chat view
    if (appState.currentView !== 'chat') {
      addNotification(`New message in ${message.circle?.name || 'circle'}`);
    }
  };

  const handleNewDirectMessage = (message: DirectMessage) => {
    console.log('📨 App received new direct message:', message);
    console.log('🔍 Current view:', appState.currentView);
    console.log('👥 Selected friend:', appState.selectedFriend?.id);
    console.log('📝 Message sender:', message.senderId);
    
    if (appState.currentView === 'direct-chat' && appState.selectedFriend?.id === message.senderId) {
      console.log('✅ Message will be handled by DirectMessageChat component');
      return;
    }
    console.log('📢 Showing notification for new message');
    addNotification(`New message from ${message.sender.name}`);
  };

  const handleFriendRequestReceived = (data: any) => {
    addNotification(`Friend request from ${data.senderEmail || 'someone'}`);
  };

  const handleFriendRequestAccepted = (data: any) => {
    addNotification(`Friend request accepted by ${data.receiverEmail || 'someone'}`);
    loadFriends(); // Refresh friends list
  };

  const handleFriendRequestRejected = (data: any) => {
    addNotification(`Friend request rejected by ${data.receiverEmail || 'someone'}`);
  };

  const handleFriendRemoved = (data: any) => {
    addNotification(`Removed as friend by ${data.removedByEmail || 'someone'}`);
    loadFriends(); // Refresh friends list
  };

  const handleWebSocketError = (error: any) => {
    console.error('WebSocket error:', error);
    // Don't show error notification - HTTP API fallback will handle messaging
    console.log('📡 WebSocket error occurred, HTTP API fallback will handle messaging');
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message));
    }, 5009);
  };

  const handleMoodSelection = async (moods: Mood[]) => {
    try {
      const response = await userAPI.getMatches(moods);
      if (response.success) {
        setAppState(prev => ({
          ...prev,
          matches: response.data,
          showMoodSelection: false,
          currentView: 'matches'
        }));
      }
    } catch (error) {
      console.error('Failed to get matches:', error);
      addNotification('Failed to find matches');
    }
  };

  const handleSendFriendRequest = async (receiverId: string, message?: string, voiceFile?: File) => {
    try {
      await friendRequestAPI.sendFriendRequest(receiverId, message, voiceFile);
      addNotification('Friend request sent successfully!');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      addNotification('Failed to send friend request');
      throw error;
    }
  };

  const handleSendDirectMessage = async (receiverId: string, content?: string) => {
    try {
      // Use WebSocket for real-time messaging if available
      if (wsService && content) {
        wsService.sendDirectMessage(receiverId, content);
        return;
      }
      
      // Fallback to HTTP API when WebSocket not available
      await directMessageAPI.sendDirectMessage(receiverId, content);
    } catch (error) {
      console.error('Failed to send direct message:', error);
      addNotification('Failed to send message');
      throw error;
    }
  };

  const handleSendVoiceDirectMessage = (receiverId: string, voiceData: string, fileName: string, duration?: number) => {
    if (wsService) {
      wsService.sendVoiceDirectMessage(receiverId, voiceData, fileName, duration);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendRequestAPI.getFriendsList();
      if (response.success) {
        setAppState(prev => ({ ...prev, friends: response.data }));
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const handleSelectConversation = (friendId: string) => {
    // Find the friend from matches, friends list, or create a placeholder
    const friend = appState.matches.find(m => m.id === friendId) || 
                  appState.friends.find(f => f.id === friendId) ||
                  { 
                    id: friendId, 
                    name: 'Unknown User', 
                    email: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  } as User;
    
    setAppState(prev => ({
      ...prev,
      selectedFriend: friend,
      currentView: 'direct-chat'
    }));
  };

  const navigateTo = (view: ViewType) => {
    setAppState(prev => ({ ...prev, currentView: view }));
  };

  const handleLogout = () => {
    logout();
    setAppState({
      currentView: 'home',
      selectedCircle: null,
      selectedFriend: null,
      matches: [],
      friends: [],
      showMoodSelection: false,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <WebSocketContext.Provider value={wsService}>
      <AudioCallProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Audio Call Manager */}
          <AudioCallManager />
          
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 max-w-sm"
                >
                  <p className="text-sm text-gray-900">{notification}</p>
                </div>
              ))}
            </div>
          )}

        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Mamami</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateTo('home')}
                  className={`p-2 rounded-lg ${appState.currentView === 'home' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Home className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => navigateTo('circles')}
                  className={`p-2 rounded-lg ${appState.currentView === 'circles' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Users className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => navigateTo('messages')}
                  className={`p-2 rounded-lg ${appState.currentView === 'messages' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => navigateTo('friends')}
                  className={`p-2 rounded-lg ${appState.currentView === 'friends' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Heart className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => navigateTo('profile')}
                  className={`p-2 rounded-lg ${appState.currentView === 'profile' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <UserIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => navigateTo('call-test')}
                  className={`p-2 rounded-lg ${appState.currentView === 'call-test' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Audio Call Test"
                >
                  📞
                </button>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4">
          {appState.currentView === 'home' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {user.name}!</h2>
                <p className="text-gray-600">What would you like to do today?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button
                  onClick={() => setAppState(prev => ({ ...prev, showMoodSelection: true }))}
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Matches</h3>
                  <p className="text-gray-600">Discover people with similar moods</p>
                </button>
                
                <button
                  onClick={() => navigateTo('circles')}
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Circles</h3>
                  <p className="text-gray-600">Connect with communities</p>
                </button>
                
                <button
                  onClick={() => navigateTo('messages')}
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <MessageCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                  <p className="text-gray-600">Chat with your friends</p>
                </button>
                
                <button
                  onClick={() => navigateTo('friends')}
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Friends</h3>
                  <p className="text-gray-600">Manage your connections</p>
                </button>
              </div>
            </div>
          )}

          {appState.showMoodSelection && (
            <MoodSelection onMoodsSelected={handleMoodSelection} />
          )}

          {appState.currentView === 'matches' && (
            <MatchList
              matches={appState.matches}
              onBack={() => setAppState(prev => ({ ...prev, currentView: 'home' }))}
              onSendFriendRequest={handleSendFriendRequest}
            />
          )}

          {appState.currentView === 'circles' && (
            <CircleList
              onCircleSelect={(circleId: string) => {
                setAppState(prev => ({ 
                  ...prev, 
                  selectedCircle: circleId, 
                  currentView: 'chat' 
                }));
              }}
            />
          )}

          {appState.currentView === 'chat' && appState.selectedCircle && (
            <ChatRoom
              circleId={appState.selectedCircle}
              onBack={() => setAppState(prev => ({ ...prev, currentView: 'circles' }))}
              wsService={wsService}
            />
          )}

          {appState.currentView === 'friends' && (
            <FriendManagement 
              onSelectConversation={handleSelectConversation} 
              friends={appState.friends}
              onFriendsUpdate={loadFriends}
            />
          )}

          {appState.currentView === 'messages' && (
            <div className="h-[calc(100vh-200px)] flex">
              <div className="w-1/3 border-r border-gray-200">
                <ConversationList onSelectConversation={handleSelectConversation} />
              </div>
              <div className="w-2/3">
                {appState.selectedFriend ? (
                  <DirectMessageChat
                    friend={appState.selectedFriend}
                    onBack={() => setAppState(prev => ({ ...prev, currentView: 'messages' }))}
                    onSendMessage={handleSendDirectMessage}
                    onSendVoiceMessage={handleSendVoiceDirectMessage}
                    wsService={wsService}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          )}

          {appState.currentView === 'direct-chat' && appState.selectedFriend && (
            <DirectMessageChat
              friend={appState.selectedFriend}
              onBack={() => setAppState(prev => ({ ...prev, currentView: 'messages' }))}
              onSendMessage={handleSendDirectMessage}
              onSendVoiceMessage={handleSendVoiceDirectMessage}
              wsService={wsService}
            />
          )}

          {appState.currentView === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-500">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-gray-900">{user.bio || 'No bio yet'}</p>
                  </div>
                  
                  {user.work && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Work</label>
                      <p className="mt-1 text-gray-900">{user.work}</p>
                    </div>
                  )}
                  
                  {user.birthday && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birthday</label>
                      <p className="mt-1 text-gray-900">{new Date(user.birthday).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {user.feelingToday && user.feelingToday.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Mood</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {user.feelingToday.map((mood) => (
                          <span
                            key={mood}
                            className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                          >
                            {mood}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {appState.currentView === 'call-test' && (
            <AudioCallDebug />
          )}
        </main>
        </div>
      </AudioCallProvider>
    </WebSocketContext.Provider>
  );
}

export default App; 