import React, { useState } from 'react';
import { useAudioCall } from '../contexts/AudioCallContext';
import { useAuth } from '../contexts/AuthContext';

const AudioCallDebug: React.FC = () => {
  const { callState, initiateCall } = useAudioCall();
  const { user } = useAuth();
  const [testUserId, setTestUserId] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testInitiateCall = () => {
    if (!testUserId.trim()) {
      addLog('❌ Please enter a test user ID');
      return;
    }
    addLog(`📞 Attempting to initiate call to: ${testUserId}`);
    try {
      initiateCall(testUserId);
      addLog('✅ Call initiation request sent');
    } catch (error) {
      addLog(`❌ Error initiating call: ${error}`);
    }
  };

  const testWebSocketConnection = () => {
    addLog('🔍 Checking WebSocket connection...');
    // This will be handled by the context
    addLog('ℹ️ WebSocket status will be logged in console');
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Audio Call Debug</h2>
        
        {/* User Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current User</h3>
          <p><strong>ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Name:</strong> {user?.name || 'Not logged in'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
        </div>

        {/* Call State */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Call State</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Is in call:</strong> {callState.isInCall ? 'Yes' : 'No'}</p>
              <p><strong>Call status:</strong> {callState.callStatus}</p>
              <p><strong>Is caller:</strong> {callState.isCaller ? 'Yes' : 'No'}</p>
              <p><strong>Is receiver:</strong> {callState.isReceiver ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Call ID:</strong> {callState.callId || 'None'}</p>
              <p><strong>Channel name:</strong> {callState.channelName || 'None'}</p>
              <p><strong>Agora App ID:</strong> {callState.agoraAppId || 'None'}</p>
              <p><strong>Token:</strong> {callState.token ? 'Present' : 'None'}</p>
            </div>
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
              placeholder="Enter user ID to call"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={testInitiateCall}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Initiate Call
            </button>
            
            <button
              onClick={testWebSocketConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test WebSocket
            </button>

            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
          <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Try testing the functionality above.</p>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Debug Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-800">
            <li>Make sure your backend is running on port 5009</li>
            <li>Check browser console for WebSocket connection logs</li>
            <li>Enter a valid user ID in the test field</li>
            <li>Click "Test Initiate Call" to test call functionality</li>
            <li>Check the debug logs above for any errors</li>
            <li>Open browser console (F12) to see detailed logs</li>
          </ol>
        </div>

        {/* Common Issues */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Common Issues to Check</h3>
          <ul className="list-disc list-inside space-y-1 text-red-800">
            <li>Backend server not running on port 5009</li>
            <li>WebSocket connection not established</li>
            <li>User not authenticated</li>
            <li>Invalid user ID format</li>
            <li>Browser console errors</li>
            <li>Network connectivity issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioCallDebug; 