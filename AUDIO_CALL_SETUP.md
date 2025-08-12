# Audio Call Setup - 1-to-1 Calling Feature

## Overview
This document describes the completed 1-to-1 audio calling feature implemented in the Mamami application using Agora for real-time audio communication.

## Features Implemented

### ✅ **Core Call Functionality**
- **Initiating Calls**: Users can start audio calls with their friends
- **Receiving Calls**: Users receive incoming call notifications
- **Call Management**: Accept, reject, and end calls
- **Real-time Audio**: High-quality audio streaming using Agora
- **Call Status Tracking**: Real-time updates of call states (ringing, connected, ended, etc.)

### ✅ **User Interface Components**
- **CallButton**: Integrated into friend management for easy call initiation
- **IncomingCallModal**: Displays incoming call notifications with accept/reject options
- **CallingModal**: Shows calling status for outgoing calls
- **ActiveCallModal**: Active call interface with mute/unmute and end call options
- **AudioCallManager**: Manages call state and displays appropriate modals

### ✅ **Technical Implementation**
- **WebSocket Integration**: Real-time call signaling via WebSocket
- **Agora SDK**: Professional audio streaming with Agora RTC SDK
- **State Management**: React Context for call state management
- **Error Handling**: Comprehensive error handling and user feedback

## Setup Requirements

### 1. **Environment Variables**
Add the following to your `.env` file:
```env
REACT_APP_AGORA_APP_ID=your_agora_app_id_here
```

### 2. **Agora Credentials**
You need to obtain from your client:
- **Agora App ID** (for both frontend and backend)
- **Agora App Certificate** (for backend only)

### 3. **Backend Configuration**
Ensure your backend has:
- WebSocket server running
- Agora token generation endpoint
- Call session management

## How to Use

### **Making a Call**
1. Navigate to Friends section
2. Find the friend you want to call
3. Click the green "Call" button
4. Wait for the other user to accept

### **Receiving a Call**
1. When someone calls you, an incoming call modal appears
2. Choose to accept (green button) or reject (red button)
3. If accepted, you'll be connected to the call

### **During a Call**
- **Mute/Unmute**: Use the mute button to control your audio
- **End Call**: Click the red "End Call" button to hang up
- **Call Duration**: See how long the call has been active

### **Call States**
- **RINGING**: Call is being initiated or received
- **CONNECTED**: Call is active and audio is streaming
- **ENDED**: Call has been terminated
- **REJECTED**: Call was declined
- **MISSED**: Call was not answered

## Technical Architecture

### **Frontend Components**
```
AudioCallContext (State Management)
├── CallButton (Call Initiation)
├── IncomingCallModal (Incoming Call UI)
├── CallingModal (Outgoing Call UI)
├── ActiveCallModal (Active Call UI)
└── AudioCallManager (Modal Coordinator)
```

### **Data Flow**
1. **Call Initiation**: Frontend → WebSocket → Backend → Agora Token Generation
2. **Call Notification**: Backend → WebSocket → Frontend → Incoming Call Modal
3. **Call Acceptance**: Frontend → WebSocket → Backend → Call Status Update
4. **Audio Connection**: Frontend → Agora SDK → Agora Servers → Audio Stream

### **WebSocket Messages**
- `initiate-call`: Start a new call
- `incoming-call`: Receive call notification
- `call-accepted`: Call was accepted
- `call-rejected`: Call was rejected
- `call-ended`: Call was terminated
- `call-missed`: Call was not answered

## Testing

### **Local Development**
1. Start your backend server
2. Set up Agora credentials in `.env`
3. Start the frontend development server
4. Test calls between two browser tabs

### **Postman Testing**
You can test WebSocket functionality using Postman:
1. Create WebSocket connection to your server
2. Authenticate with JWT token
3. Send call-related messages
4. Verify responses and notifications

## Troubleshooting

### **Common Issues**
1. **"Agora App ID not configured"**
   - Check your `.env` file has `REACT_APP_AGORA_APP_ID`
   - Restart development server after changes

2. **WebSocket connection failed**
   - Verify backend server is running
   - Check WebSocket URL in `.env`
   - Ensure JWT token is valid

3. **Audio not working**
   - Check browser permissions for microphone
   - Verify Agora credentials are correct
   - Check browser console for errors

### **Debug Tools**
- Use the "Call Test" button in navigation for debugging
- Check browser console for detailed logs
- Monitor WebSocket connection status

## Security Features

- **JWT Authentication**: All calls require valid authentication
- **Token-based Access**: Agora tokens are generated server-side
- **User Validation**: Only friends can call each other
- **Secure WebSocket**: All communication is encrypted

## Performance Considerations

- **Audio Quality**: Optimized for voice calls with VP8 codec
- **Network Efficiency**: Adaptive bitrate based on connection quality
- **Resource Management**: Automatic cleanup of audio resources
- **Memory Optimization**: Efficient state management and cleanup

## Future Enhancements

- **Video Calling**: Add video support
- **Group Calls**: Support for multiple participants
- **Call Recording**: Option to record calls
- **Screen Sharing**: Share screen during calls
- **Call History**: Track and display call logs

## Support

For technical support or questions about the calling feature:
1. Check the browser console for error messages
2. Verify all environment variables are set
3. Ensure backend services are running
4. Check Agora console for service status 