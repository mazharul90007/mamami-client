import React from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';

interface CallButtonProps {
  receiverId: string;
  receiverName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'icon';
}

const CallButton: React.FC<CallButtonProps> = ({
  receiverId,
  receiverName,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const { callState, initiateCall } = useAudioCall();

  const handleCall = () => {
    if (!callState.isInCall) {
      console.log('📞 CallButton: Initiating call to:', receiverId);
      initiateCall(receiverId);
    } else {
      console.log('📞 CallButton: Call already in progress, cannot initiate new call');
    }
  };

  const isDisabled = callState.isInCall;
  
  // Debug logging
  React.useEffect(() => {
    console.log('📞 CallButton state:', {
      receiverId,
      isInCall: callState.isInCall,
      callStatus: callState.callStatus,
      isCaller: callState.isCaller,
      isReceiver: callState.isReceiver,
      isDisabled
    });
  }, [callState.isInCall, callState.callStatus, callState.isCaller, callState.isReceiver, isDisabled, receiverId]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'bg-green-500 hover:bg-green-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    icon: 'bg-transparent hover:bg-gray-100 text-gray-600'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCall}
        disabled={isDisabled}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-colors ${
          variantClasses[variant]
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={receiverName ? `Call ${receiverName}` : 'Call'}
      >
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleCall}
      disabled={isDisabled}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-colors ${
        variantClasses[variant]
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <svg
        className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    </button>
  );
};

export default CallButton; 