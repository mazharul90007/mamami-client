import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CallState, IncomingCallData, CallInitiatedData, User } from '../types';
import agoraService from '../services/agoraService';

interface AudioCallContextType {
  callState: CallState;
  initiateCall: (receiverId: string) => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  endCall: () => void;
  muteAudio: (muted: boolean) => void;
  isAudioMuted: () => boolean;
}

const AudioCallContext = createContext<AudioCallContextType | undefined>(undefined);

// Initial call state
const initialCallState: CallState = {
  isInCall: false,
  callId: undefined,
  channelName: undefined,
  agoraAppId: undefined,
  token: undefined,
  isCaller: false,
  isReceiver: false,
  callStatus: 'IDLE',
  remoteUser: undefined,
  duration: 0
};

// Call state reducer
type CallAction =
  | { type: 'INITIATE_CALL'; payload: { receiverId: string } }
  | { type: 'CALL_INITIATED'; payload: CallInitiatedData }
  | { type: 'INCOMING_CALL'; payload: IncomingCallData & { callerName: string; callerPhoto?: string } }
  | { type: 'CALL_ACCEPTED'; payload: { callId: string } }
  | { type: 'CALL_REJECTED'; payload: { callId: string } }
  | { type: 'CALL_ENDED'; payload: { callId: string; duration?: number } }
  | { type: 'CALL_MISSED'; payload: { callId: string } }
  | { type: 'UPDATE_DURATION'; payload: { duration: number } }
  | { type: 'RESET_CALL' };

function callReducer(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case 'INITIATE_CALL':
      return {
        ...state,
        isInCall: true,
        isCaller: true,
        isReceiver: false,
        callStatus: 'RINGING',
        remoteUser: { id: action.payload.receiverId } as User
      };

    case 'CALL_INITIATED':
      return {
        ...state,
        callId: action.payload.callId,
        channelName: action.payload.channelName,
        agoraAppId: action.payload.agoraAppId,
        token: action.payload.token
      };

    case 'INCOMING_CALL':
      return {
        ...state,
        isInCall: true,
        isCaller: false,
        isReceiver: true,
        callStatus: 'RINGING',
        callId: action.payload.callId,
        channelName: action.payload.channelName,
        agoraAppId: action.payload.agoraAppId,
        token: action.payload.token,
        remoteUser: {
          id: action.payload.callId.split('_')[2], // Extract caller ID from callId
          name: action.payload.callerName,
          profilePhotoUrl: action.payload.callerPhoto
        } as User
      };

    case 'CALL_ACCEPTED':
      return {
        ...state,
        callStatus: 'CONNECTED'
      };

    case 'CALL_REJECTED':
      return {
        ...state,
        callStatus: 'REJECTED'
      };

    case 'CALL_ENDED':
      return {
        ...state,
        callStatus: 'ENDED',
        duration: action.payload.duration || state.duration
      };

    case 'CALL_MISSED':
      return {
        ...state,
        callStatus: 'MISSED'
      };

    case 'UPDATE_DURATION':
      return {
        ...state,
        duration: action.payload.duration
      };

    case 'RESET_CALL':
      return initialCallState;

    default:
      return state;
  }
}

// Custom hook to connect WebSocket events to AudioCallContext
const useWebSocketConnection = (dispatch: React.Dispatch<CallAction>) => {
  useEffect(() => {
    const checkWebSocket = () => {
      const wsService = (window as any).wsService;
      if (wsService && wsService.ws && wsService.ws.readyState === WebSocket.OPEN) {
        console.log('🔌 WebSocket connected, setting up call event listeners');
        
        // Set up call event listeners
        wsService.on('call-initiated', (data: CallInitiatedData) => {
          console.log('📞 Call initiated received in AudioCallContext:', data);
          dispatch({ type: 'CALL_INITIATED', payload: data });
        });

        wsService.on('incoming-call', (data: IncomingCallData & { callerName: string; callerPhoto?: string }) => {
          console.log('📞 Incoming call received in AudioCallContext:', data);
          dispatch({ type: 'INCOMING_CALL', payload: data });
        });

        wsService.on('call-accepted', (data: { callId: string }) => {
          console.log('✅ Call accepted received in AudioCallContext:', data);
          dispatch({ type: 'CALL_ACCEPTED', payload: data });
        });

        wsService.on('call-rejected', (data: { callId: string }) => {
          console.log('❌ Call rejected received in AudioCallContext:', data);
          dispatch({ type: 'CALL_REJECTED', payload: data });
        });

        wsService.on('call-ended', (data: { callId: string; duration?: number }) => {
          console.log('📞 Call ended received in AudioCallContext:', data);
          dispatch({ type: 'CALL_ENDED', payload: data });
        });

        wsService.on('call-missed', (data: { callId: string }) => {
          console.log('📞 Call missed received in AudioCallContext:', data);
          dispatch({ type: 'CALL_MISSED', payload: data });
        });

        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkWebSocket()) {
      // If not connected, check every second
      const interval = setInterval(checkWebSocket, 1000);
      return () => clearInterval(interval);
    }
  }, [dispatch]);
};

export const AudioCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [callState, dispatch] = useReducer(callReducer, initialCallState);

  // Initialize Agora service
  useEffect(() => {
    const initAgora = async () => {
      try {
        await agoraService.initialize();
        console.log('✅ Agora service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Agora service:', error);
      }
    };

    initAgora();
  }, []);

  // Connect WebSocket events
  useWebSocketConnection(dispatch);

  // Handle call status changes
  useEffect(() => {
    if (callState.callStatus === 'CONNECTED' && callState.channelName && callState.token) {
      // Join Agora channel when call is connected
      const uid = Math.random().toString(36).substr(2, 9); // Generate unique UID
      agoraService.joinChannel(callState.channelName, callState.token, uid)
        .then(() => {
          console.log('✅ Successfully joined Agora channel');
        })
        .catch((error) => {
          console.error('❌ Failed to join Agora channel:', error);
        });
    }

    if (['ENDED', 'REJECTED', 'MISSED'].includes(callState.callStatus)) {
      // Leave Agora channel and reset call state
      agoraService.leaveChannel();
      
      setTimeout(() => {
        dispatch({ type: 'RESET_CALL' });
      }, 2000);
    }
  }, [callState.callStatus, callState.channelName, callState.token]);

  // Update call duration when connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState.callStatus === 'CONNECTED') {
      interval = setInterval(() => {
        dispatch({ type: 'UPDATE_DURATION', payload: { duration: callState.duration + 1 } });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callState.callStatus, callState.duration]);

  // Call control functions
  const initiateCall = (receiverId: string) => {
    console.log('🔧 AudioCallContext: initiateCall called with receiverId:', receiverId);
    
    // Get WebSocket service from window
    const wsService = (window as any).wsService;
    if (!wsService) {
      console.error('❌ WebSocket service not available');
      return;
    }

    dispatch({ type: 'INITIATE_CALL', payload: { receiverId } });
    console.log('📤 Calling wsService.initiateCall');
    wsService.initiateCall(receiverId);
  };

  const acceptCall = (callId: string) => {
    console.log('✅ AudioCallContext: acceptCall called with callId:', callId);
    const wsService = (window as any).wsService;
    wsService?.acceptCall(callId);
  };

  const rejectCall = (callId: string) => {
    console.log('❌ AudioCallContext: rejectCall called with callId:', callId);
    const wsService = (window as any).wsService;
    wsService?.rejectCall(callId);
  };

  const endCall = () => {
    console.log('📞 AudioCallContext: endCall called');
    if (callState.callId) {
      const wsService = (window as any).wsService;
      wsService?.endCall(callState.callId);
    }
  };

  const muteAudio = (muted: boolean) => {
    agoraService.muteAudio(muted);
  };

  const isAudioMuted = () => {
    return agoraService.isAudioMuted();
  };

  const contextValue: AudioCallContextType = {
    callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    muteAudio,
    isAudioMuted,
  };

  return (
    <AudioCallContext.Provider value={contextValue}>
      {children}
    </AudioCallContext.Provider>
  );
};

export const useAudioCall = (): AudioCallContextType => {
  const context = useContext(AudioCallContext);
  if (context === undefined) {
    throw new Error('useAudioCall must be used within an AudioCallProvider');
  }
  return context;
}; 