import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useAudioCall } from '../contexts/AudioCallContext';

interface CallButtonProps {
  receiverId: string;
  receiverName: string;
  className?: string;
}

const CallButton: React.FC<CallButtonProps> = ({ 
  receiverId, 
  receiverName, 
  className = '' 
}) => {
  const { callState, initiateCall, endCall } = useAudioCall();

  // Check if this user is the current call target
  const isCurrentCallTarget = callState.isInCall && 
    callState.remoteUser?.id === receiverId;

  // Check if we can make a call (not in a call or this is the current call)
  const canMakeCall = !callState.isInCall || isCurrentCallTarget;

  // Check if call is in progress
  const isCallInProgress = isCurrentCallTarget && 
    ['RINGING', 'CONNECTED'].includes(callState.callStatus);

  const handleCallClick = () => {
    if (isCallInProgress) {
      endCall();
    } else if (canMakeCall) {
      initiateCall(receiverId);
    }
  };

  const getButtonText = () => {
    if (isCallInProgress) {
      if (callState.callStatus === 'RINGING') {
        return callState.isCaller ? 'Calling...' : 'Incoming...';
      }
      if (callState.callStatus === 'CONNECTED') {
        return 'End Call';
      }
    }
    return 'Call';
  };

  const getButtonIcon = () => {
    if (isCallInProgress) {
      return <PhoneOff className="h-4 w-4" />;
    }
    return <Phone className="h-4 w-4" />;
  };

  const getButtonClasses = () => {
    let baseClasses = 'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors';
    
    if (isCallInProgress) {
      if (callState.callStatus === 'CONNECTED') {
        baseClasses += ' bg-red-500 text-white hover:bg-red-600';
      } else {
        baseClasses += ' bg-yellow-500 text-white hover:bg-yellow-600';
      }
    } else if (canMakeCall) {
      baseClasses += ' bg-green-500 text-white hover:bg-green-600';
    } else {
      baseClasses += ' bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    return `${baseClasses} ${className}`;
  };

  return (
    <button
      onClick={handleCallClick}
      disabled={!canMakeCall}
      className={getButtonClasses()}
      title={isCallInProgress ? 'End call' : `Call ${receiverName}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </button>
  );
};

export default CallButton; 