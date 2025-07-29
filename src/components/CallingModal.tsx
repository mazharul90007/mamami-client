import React from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';

interface CallingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CallingModal: React.FC<CallingModalProps> = ({ isOpen, onClose }) => {
  const { callState, endCall } = useAudioCall();

  if (!isOpen || !callState.isInCall || !callState.isCaller || callState.callStatus !== 'RINGING') {
    return null;
  }

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Remote User Avatar */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            {callState.remoteUser?.profilePhotoUrl ? (
              <img
                src={callState.remoteUser.profilePhotoUrl}
                alt={callState.remoteUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="text-3xl text-gray-500">
                {callState.remoteUser?.name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Remote User Name */}
          <h3 className="text-xl font-semibold mb-2">
            {callState.remoteUser?.name || 'Unknown User'}
          </h3>

          {/* Call Status */}
          <p className="text-gray-600 mb-6">Calling...</p>

          {/* Call Controls */}
          <div className="flex justify-center">
            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>
          </div>

          {/* Call Status Indicator */}
          <div className="mt-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-yellow-600">Calling</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallingModal; 