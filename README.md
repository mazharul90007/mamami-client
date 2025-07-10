# Mamami Client Demo

A React demo application for testing the Mamami backend realtime chat functionality.

## Features

- **User Authentication**: Login and registration with JWT tokens
- **Circle Management**: View, join, and leave circles
- **Realtime Chat**: WebSocket-based realtime messaging with typing indicators
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm
- Backend server running on `http://localhost:5000`

## Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Testing Multi-User Chat

To test realtime chat with multiple users:

1. **Open multiple browser windows/tabs** to `http://localhost:3000`
2. **Register different users** in each window:
   - User 1: `alice@example.com` / `password123`
   - User 2: `bob@example.com` / `password123`
   - User 3: `charlie@example.com` / `password123`

3. **Join the same circle** in all windows
4. **Start chatting** - messages will appear in real-time across all windows

## Backend Integration

This client is fully integrated with your Mamami backend:

### API Endpoints
- **Auth**: `/api/auth/login`, `/api/auth/signup`
- **Circles**: `/api/circles/*`
- **Messages**: `/api/circles/messages`

### WebSocket Events
- **Authentication**: `authenticate` with JWT token
- **Circle Operations**: `join-circle`, `leave-circle`
- **Messaging**: `send-message`, `new-message`
- **Typing Indicators**: `typing`, `user-typing`

## Troubleshooting

### PowerShell Execution Policy Error
If you get execution policy errors when running pnpm:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend Connection Issues
- Ensure your backend is running on `http://localhost:5000`
- Check that the backend WebSocket server is active
- Verify CORS settings in your backend

### WebSocket Connection Issues
- Check browser console for WebSocket errors
- Ensure JWT token is valid and not expired
- Verify WebSocket URL: `ws://localhost:5000/ws`

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatRoom.tsx    # Realtime chat interface
│   ├── CircleList.tsx  # Circle management
│   ├── LoginForm.tsx   # User authentication
│   └── RegisterForm.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── services/           # API and WebSocket services
│   ├── api.ts         # REST API calls
│   └── websocket.ts   # WebSocket connection
└── types/             # TypeScript type definitions
    └── index.ts
```

## Development

The client uses:
- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for HTTP requests
- **Tailwind CSS** for styling
- **Lucide React** for icons

All API calls and WebSocket messages are structured to match your backend exactly. 