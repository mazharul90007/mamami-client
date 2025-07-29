# Mamami Client

A modern React application for real-time social networking with circles, direct messaging, and friend management.

## Features

### 🔐 Authentication & User Management
- **User Registration & Login**: JWT-based authentication
- **Profile Management**: View and edit user profiles
- **Session Management**: Automatic token refresh and validation

### 👥 Social Features
- **Friend System**: Send, accept, and reject friend requests
- **Friend Management**: View friends list and remove friends
- **User Discovery**: Find and connect with other users

### 💬 Real-time Communication
- **Circle Chat**: Join circles and participate in group discussions
- **Direct Messages**: Private 1-to-1 conversations with friends
- **Voice Messages**: Send and receive voice messages in direct chats
- **Typing Indicators**: Real-time typing status for both circles and direct messages
- **Message History**: Persistent message storage and retrieval

### 🎯 Circle System
- **Circle Discovery**: Browse and join available circles
- **Circle Management**: View circle details and member information
- **Real-time Circle Chat**: Instant messaging within circles
- **Message Persistence**: All messages saved to database

### 📱 Modern UI/UX
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant message delivery without page refresh
- **Loading States**: Smooth loading indicators and error handling
- **Modern Icons**: Lucide React icons throughout the interface

## Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm
- Backend server running on `http://localhost:5009`

## Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   pnpm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Testing Multi-User Features

### Circle Chat Testing
1. **Open multiple browser windows/tabs** to `http://localhost:3000`
2. **Register different users** in each window:
   - User 1: `alice@example.com` / `password123`
   - User 2: `bob@example.com` / `password123`
   - User 3: `charlie@example.com` / `password123`

3. **Navigate to Circles** and join the same circle in all windows
4. **Start chatting** - messages will appear in real-time across all windows

### Direct Message Testing
1. **Register two users** in different browser windows
2. **Add each other as friends** using the friend system
3. **Start a direct conversation** - messages will be private between the two users
4. **Test voice messages** - record and send voice messages

## Backend Integration

This client is fully integrated with the Mamami backend:

### API Endpoints
- **Auth**: `/api/v1/auth/login`, `/api/v1/auth/signup`
- **User Management**: `/api/v1/user/profile`, `/api/v1/user/upload`
- **Circles**: `/api/v1/circles/*`
- **Friend System**: `/api/v1/friend-requests/*`, `/api/v1/friends/*`
- **Direct Messages**: `/api/v1/direct-messages/*`

### WebSocket Events
- **Authentication**: `authenticate` with JWT token
- **Circle Operations**: `join-circle`, `leave-circle`, `send-message`
- **Direct Messages**: `send-direct-message`, `new-direct-message`
- **Friend System**: `send-friend-request`, `accept-friend-request`, `reject-friend-request`
- **Typing Indicators**: `typing`, `user-typing`
- **Real-time Updates**: `new-message`, `message-sent`

## Project Structure

```
src/
├── components/              # React components
│   ├── ChatRoom.tsx        # Circle chat interface
│   ├── DirectMessageChat.tsx # Direct message interface
│   ├── CircleList.tsx      # Circle management
│   ├── FriendManagement.tsx # Friend system
│   ├── ConversationList.tsx # Direct message conversations
│   ├── LoginForm.tsx       # User authentication
│   ├── RegisterForm.tsx    # User registration
│   └── Profile.tsx         # User profile
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication state
├── services/               # API and WebSocket services
│   ├── api.ts             # REST API calls
│   └── websocket.ts       # WebSocket connection
├── types/                 # TypeScript type definitions
│   └── index.ts
└── utils/                 # Utility functions
    └── tokenUtils.ts      # Token management
```

## Key Features

### Real-time Communication
- **WebSocket Integration**: Persistent WebSocket connections for real-time updates
- **Message Broadcasting**: Circle messages sent to all circle members
- **Direct Messaging**: Private conversations between friends
- **Typing Indicators**: Real-time typing status for better UX

### Friend System
- **Friend Requests**: Send and manage friend requests
- **Friend Management**: Accept, reject, and remove friends
- **Friend Discovery**: Find and connect with other users

### Circle System
- **Circle Joining**: Join circles to participate in group discussions
- **Message Persistence**: All messages saved to database
- **Real-time Updates**: Instant message delivery to all circle members

### Voice Messages
- **Voice Recording**: Record voice messages in direct chats
- **Audio Playback**: Play received voice messages
- **File Upload**: Voice messages uploaded to cloud storage

## Development

The client uses:
- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for HTTP requests
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **WebSocket API** for real-time communication

## Troubleshooting

### PowerShell Execution Policy Error
If you get execution policy errors when running pnpm:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend Connection Issues
- Ensure your backend is running on `http://localhost:5009`
- Check that the backend WebSocket server is active
- Verify CORS settings in your backend

### WebSocket Connection Issues
- Check browser console for WebSocket errors
- Ensure JWT token is valid and not expired
- Verify WebSocket URL: `ws://localhost:5009`

### Real-time Chat Issues
- Check browser console for WebSocket connection logs
- Verify that users are properly joining circles
- Ensure backend WebSocket server is running

## Environment Variables

The client uses the following environment variables:
- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:5009`)
- `REACT_APP_WS_URL`: WebSocket URL (default: `ws://localhost:5009`)

All API calls and WebSocket messages are structured to match the backend exactly. 