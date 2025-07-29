import React, { useState } from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';
import CallButton from './CallButton';

const AudioCallTest: React.FC = () => {
  const { callState } = useAudioCall();
  const [testUserId, setTestUserId] = useState('test-user-123');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Audio Call Test</h2>
        
        {/* Current Call Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Call Status</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Is in call:</strong> {callState.isInCall ? 'Yes' : 'No'}</p>
            <p><strong>Call status:</strong> {callState.callStatus}</p>
            <p><strong>Is caller:</strong> {callState.isCaller ? 'Yes' : 'No'}</p>
            <p><strong>Is receiver:</strong> {callState.isReceiver ? 'Yes' : 'No'}</p>
            <p><strong>Call ID:</strong> {callState.callId || 'None'}</p>
            <p><strong>Channel name:</strong> {callState.channelName || 'None'}</p>
            <p><strong>Duration:</strong> {callState.duration} seconds</p>
            <p><strong>Remote user:</strong> {callState.remoteUser?.name || 'None'}</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Test Controls</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test User ID
            </label>
            <input
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter test user ID"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <CallButton
              receiverId={testUserId}
              receiverName="Test User"
              variant="primary"
              size="lg"
            />
            
            <button
              onClick={() => {
                // Simulate incoming call for testing
                console.log('Simulating incoming call...');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Simulate Incoming Call
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Open this page in two different browser windows/tabs</li>
            <li>Log in with different user accounts in each window</li>
            <li>Use the call button to initiate a call from one window</li>
            <li>Accept the incoming call in the other window</li>
            <li>Test the mute/unmute and end call functionality</li>
          </ol>
        </div>

        {/* WebSocket Connection Status */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-800">
            <li>Make sure your backend server is running on port 5009</li>
            <li>Ensure WebSocket connection is established</li>
            <li>Check browser console for any errors</li>
            <li>Allow microphone permissions when prompted</li>
            <li>Both users must be online for calls to work</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioCallTest; 