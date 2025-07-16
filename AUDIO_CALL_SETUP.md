# Audio Call Feature Setup and Testing Guide

## Overview
This guide explains how to set up and test the 1-to-1 real-time audio call feature using Agora RTC SDK.

## Prerequisites
1. Backend server running on port 5000 with WebSocket support
2. Agora App ID and App Certificate configured in backend
3. Two user accounts for testing
4. Microphone permissions enabled in browser

## Features Implemented

### 1. Audio Call Components
- **AudioCallContext**: Manages call state and provides call functions
- **AudioCallManager**: Handles call UI and modal management
- **IncomingCallModal**: Shows incoming call interface
- **ActiveCallModal**: Shows active call interface with controls
- **CallButton**: Reusable component for initiating calls

### 2. WebSocket Integration
- Call initiation via WebSocket
- Real-time call status updates
- Call acceptance/rejection handling
- Call ending functionality

### 3. Agora RTC Integration
- Audio-only calls
- Mute/unmute functionality
- Call duration tracking
- Automatic cleanup on call end

## How to Test

### Step 1: Start the Backend
```bash
cd mamami
npm run dev  # or your backend start command
```

### Step 2: Start the Frontend
```bash
cd mamami-client
pnpm start
```

### Step 3: Test Audio Calls

1. **Open two browser windows/tabs**
2. **Log in with different user accounts** in each window
3. **Navigate to the Audio Call Test page** by clicking the 📞 icon in the navigation
4. **Initiate a call**:
   - In one window, enter the other user's ID in the "Test User ID" field
   - Click the green call button
5. **Accept the incoming call**:
   - In the other window, you'll see an incoming call modal
   - Click the green accept button
6. **Test call features**:
   - Mute/unmute your microphone
   - Check call duration
   - End the call

### Step 4: Test in Real Components

1. **Direct Message Calls**:
   - Go to Messages section
   - Select a conversation
   - Click the call button in the chat header

2. **Match List Calls**:
   - Go to Find Matches
   - Click the call button on any match card

## WebSocket Events

The frontend handles these WebSocket events:

- `initiate-call`: Start a call
- `call-initiated`: Call successfully initiated
- `incoming-call`: Receive incoming call
- `accept-call`: Accept incoming call
- `call-accepted`: Call accepted by receiver
- `reject-call`: Reject incoming call
- `call-rejected`: Call rejected
- `end-call`: End active call
- `call-ended`: Call ended
- `call-missed`: Call missed

## Agora Configuration

The backend should have these environment variables:
```
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
AGORA_TOKEN_EXPIRATION_TIME=3600
```

## Troubleshooting

### Common Issues

1. **"User is not online" error**:
   - Ensure both users are logged in and WebSocket is connected
   - Check browser console for WebSocket connection status

2. **"Failed to join Agora channel" error**:
   - Check if Agora App ID is correctly configured
   - Ensure microphone permissions are granted
   - Check browser console for detailed error messages

3. **No audio in call**:
   - Check microphone permissions
   - Ensure both users have granted microphone access
   - Check if audio devices are working

4. **WebSocket connection issues**:
   - Ensure backend is running on port 5000
   - Check if WebSocket URL is correct
   - Verify authentication token is valid

### Debug Information

The components include extensive console logging. Check the browser console for:
- WebSocket connection status
- Call state changes
- Agora channel events
- Error messages

## File Structure

```
src/
├── components/
│   ├── AudioCallManager.tsx      # Main call UI manager
│   ├── IncomingCallModal.tsx     # Incoming call interface
│   ├── ActiveCallModal.tsx       # Active call interface
│   ├── CallButton.tsx           # Reusable call button
│   └── AudioCallTest.tsx        # Test component
├── contexts/
│   └── AudioCallContext.tsx     # Call state management
├── services/
│   ├── websocket.ts             # WebSocket service (updated)
│   └── agoraService.ts          # Agora RTC service
└── types/
    └── index.ts                 # Type definitions (updated)
```

## Security Notes

- Agora tokens are generated server-side for security
- WebSocket authentication is required for all call operations
- Call sessions are tracked in the database
- Users can only call online users

## Performance Considerations

- Audio calls are optimized for low latency
- Automatic cleanup prevents memory leaks
- Call state is managed efficiently with React context
- WebSocket reconnection handles network issues 