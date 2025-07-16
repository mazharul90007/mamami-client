import React, { useState, useEffect } from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';
import IncomingCallModal from './IncomingCallModal';
import ActiveCallModal from './ActiveCallModal';

const AudioCallManager: React.FC = () => {
  const { callState } = useAudioCall();
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showActiveCall, setShowActiveCall] = useState(false);

  // Handle incoming call modal
  useEffect(() => {
    if (callState.isInCall && callState.isReceiver && callState.callStatus === 'RINGING') {
      setShowIncomingCall(true);
    } else {
      setShowIncomingCall(false);
    }
  }, [callState.isInCall, callState.isReceiver, callState.callStatus]);

  // Handle active call modal
  useEffect(() => {
    if (callState.isInCall && callState.callStatus === 'CONNECTED') {
      setShowActiveCall(true);
    } else {
      setShowActiveCall(false);
    }
  }, [callState.isInCall, callState.callStatus]);

  // Auto-hide modals when call ends
  useEffect(() => {
    if (['ENDED', 'REJECTED', 'MISSED'].includes(callState.callStatus)) {
      const timer = setTimeout(() => {
        setShowIncomingCall(false);
        setShowActiveCall(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [callState.callStatus]);

  return (
    <>
      <IncomingCallModal
        isOpen={showIncomingCall}
        onClose={() => setShowIncomingCall(false)}
      />
      <ActiveCallModal
        isOpen={showActiveCall}
        onClose={() => setShowActiveCall(false)}
      />
    </>
  );
};

export default AudioCallManager; 