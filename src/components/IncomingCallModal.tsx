import React from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';

interface IncomingCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ isOpen, onClose }) => {
  const { callState, acceptCall, rejectCall } = useAudioCall();

  if (!isOpen || !callState.isInCall || !callState.isReceiver || callState.callStatus !== 'RINGING') {
    return null;
  }

  const handleAccept = () => {
    if (callState.callId) {
      acceptCall(callState.callId);
    }
    onClose();
  };

  const handleReject = () => {
    if (callState.callId) {
      rejectCall(callState.callId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Caller Avatar */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            {callState.remoteUser?.profilePhotoUrl ? (
              <img
                src={callState.remoteUser.profilePhotoUrl}
                alt={callState.remoteUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="text-2xl text-gray-500">
                {callState.remoteUser?.name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Caller Name */}
          <h3 className="text-xl font-semibold mb-2">
            {callState.remoteUser?.name || 'Unknown Caller'}
          </h3>

          {/* Call Status */}
          <p className="text-gray-600 mb-6">Incoming call...</p>

          {/* Call Actions */}
          <div className="flex justify-center space-x-4">
            {/* Accept Button */}
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-8 h-8 text-white"
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

            {/* Reject Button */}
            <button
              onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal; 