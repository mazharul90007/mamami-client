import React, { useState, useEffect } from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';

interface ActiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActiveCallModal: React.FC<ActiveCallModalProps> = ({ isOpen, onClose }) => {
  const { callState, endCall, muteAudio, isAudioMuted } = useAudioCall();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(isAudioMuted());
  }, [isAudioMuted]);

  if (!isOpen || !callState.isInCall || callState.callStatus !== 'CONNECTED') {
    return null;
  }

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const handleToggleMute = async () => {
    const newMutedState = !isMuted;
    await muteAudio(newMutedState);
    setIsMuted(newMutedState);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

          {/* Call Status and Duration */}
          <p className="text-gray-600 mb-2">Connected</p>
          <p className="text-sm text-gray-500 mb-6">{formatDuration(callState.duration)}</p>

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMuted ? (
                  // Muted icon
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </>
                ) : (
                  // Unmuted icon
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                )}
              </svg>
            </button>

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
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallModal; 