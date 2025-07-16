import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CallState, IncomingCallData, CallInitiatedData, User } from '../types';
import WebSocketService from '../services/websocket';
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

interface AudioCallProviderProps {
  children: ReactNode;
  wsService: WebSocketService | null;
}

export const AudioCallProvider: React.FC<AudioCallProviderProps> = ({ children, wsService }) => {
  const [callState, dispatch] = useReducer(callReducer, initialCallState);
  const [durationInterval, setDurationInterval] = React.useState<NodeJS.Timeout | null>(null);

  // Set up WebSocket event listeners
  useEffect(() => {
    console.log('🔧 AudioCallContext: Setting up WebSocket listeners, wsService:', !!wsService);
    
    const handleCallInitiated = (data: CallInitiatedData) => {
      console.log('📞 Call initiated:', data);
      dispatch({ type: 'CALL_INITIATED', payload: data });
    };

    const handleIncomingCall = (data: IncomingCallData & { callerName: string; callerPhoto?: string }) => {
      console.log('📞 Incoming call:', data);
      dispatch({ type: 'INCOMING_CALL', payload: data });
    };

    const handleCallAccepted = (data: { callId: string }) => {
      console.log('✅ Call accepted:', data);
      dispatch({ type: 'CALL_ACCEPTED', payload: data });
    };

    const handleCallRejected = (data: { callId: string }) => {
      console.log('❌ Call rejected:', data);
      dispatch({ type: 'CALL_REJECTED', payload: data });
    };

    const handleCallEnded = (data: { callId: string; duration?: number }) => {
      console.log('📞 Call ended:', data);
      dispatch({ type: 'CALL_ENDED', payload: data });
    };

    const handleCallMissed = (data: { callId: string }) => {
      console.log('📞 Call missed:', data);
      dispatch({ type: 'CALL_MISSED', payload: data });
    };

    // Register event listeners only if WebSocket service is available
    if (wsService) {
      wsService.on('call-initiated', handleCallInitiated);
      wsService.on('incoming-call', handleIncomingCall);
      wsService.on('call-accepted', handleCallAccepted);
      wsService.on('call-rejected', handleCallRejected);
      wsService.on('call-ended', handleCallEnded);
      wsService.on('call-missed', handleCallMissed);

      // Cleanup
      return () => {
        wsService.off('call-initiated', handleCallInitiated);
        wsService.off('incoming-call', handleIncomingCall);
        wsService.off('call-accepted', handleCallAccepted);
        wsService.off('call-rejected', handleCallRejected);
        wsService.off('call-ended', handleCallEnded);
        wsService.off('call-missed', handleCallMissed);
      };
    }
    
    return () => {};
  }, [wsService]);

  // Handle call duration timer
  useEffect(() => {
    if (callState.callStatus === 'CONNECTED') {
      const interval = setInterval(() => {
        dispatch({ type: 'UPDATE_DURATION', payload: { duration: callState.duration + 1 } });
      }, 1000);
      setDurationInterval(interval);
    } else {
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
    }

    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
    };
  }, [callState.callStatus, callState.duration]);

  // Handle call status changes
  useEffect(() => {
    if (callState.callStatus === 'CONNECTED' && callState.channelName && callState.token && callState.agoraAppId) {
      // Join Agora channel when call is connected
      const joinAgoraChannel = async () => {
        try {
          await agoraService.initialize(callState.agoraAppId!);
          await agoraService.joinChannel(
            callState.agoraAppId!,
            callState.channelName!,
            callState.token!,
            callState.isCaller ? 'caller' : 'receiver'
          );
          console.log('Successfully joined Agora channel');
        } catch (error) {
          console.error('Failed to join Agora channel:', error);
        }
      };
      joinAgoraChannel();
    }

    if (['ENDED', 'REJECTED', 'MISSED'].includes(callState.callStatus)) {
      // Leave Agora channel and reset call state after a delay
      const cleanupCall = async () => {
        try {
          await agoraService.leaveChannel();
        } catch (error) {
          console.error('Failed to leave Agora channel:', error);
        }
        
        setTimeout(() => {
          dispatch({ type: 'RESET_CALL' });
        }, 2000);
      };
      cleanupCall();
    }
  }, [callState.callStatus, callState.channelName, callState.token, callState.agoraAppId, callState.isCaller]);

  const initiateCall = (receiverId: string) => {
    console.log('🔧 AudioCallContext: initiateCall called with receiverId:', receiverId);
    if (!wsService) {
      console.error('❌ WebSocket service not available');
      return;
    }
    console.log('✅ WebSocket service available, dispatching INITIATE_CALL');
    dispatch({ type: 'INITIATE_CALL', payload: { receiverId } });
    console.log('📤 Calling wsService.initiateCall');
    wsService.initiateCall(receiverId);
  };

  const acceptCall = (callId: string) => {
    if (!wsService) {
      console.error('WebSocket service not available');
      return;
    }
    wsService.acceptCall(callId);
  };

  const rejectCall = (callId: string) => {
    if (!wsService) {
      console.error('WebSocket service not available');
      return;
    }
    wsService.rejectCall(callId);
  };

  const endCall = () => {
    if (!wsService) {
      console.error('WebSocket service not available');
      return;
    }
    if (callState.callId) {
      wsService.endCall(callState.callId);
    }
  };

  const muteAudio = async (muted: boolean) => {
    try {
      await agoraService.muteAudio(muted);
    } catch (error) {
      console.error('Failed to mute/unmute audio:', error);
    }
  };

  const isAudioMuted = () => {
    return agoraService.isAudioMuted();
  };

  const value: AudioCallContextType = {
    callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    muteAudio,
    isAudioMuted
  };

  return (
    <AudioCallContext.Provider value={value}>
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