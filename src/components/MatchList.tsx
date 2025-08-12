import React, { useState } from 'react';
import { User } from '../types';
import CallButton from './CallButton';
import { UserPlus, MessageCircle, Mic, Loader2, ArrowLeft } from 'lucide-react';

interface MatchListProps {
  matches: User[];
  onBack: () => void;
  onSendFriendRequest: (receiverId: string, message?: string, voiceFile?: File) => Promise<void>;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onBack, onSendFriendRequest }) => {
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const handleSendFriendRequest = async (receiverId: string) => {
    setSendingRequests(prev => new Set(prev).add(receiverId));
    try {
      await onSendFriendRequest(receiverId, message, voiceFile || undefined);
      setMessage('');
      setVoiceFile(null);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiverId);
        return newSet;
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        setVoiceFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const getAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Your Matches</h2>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <UserPlus className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600">Try selecting different moods to find more people</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                  {user.profilePhotoUrl ? (
                    <img
                      src={user.profilePhotoUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  {user.birthday && (
                    <p className="text-sm text-gray-600">{getAge(user.birthday)} years old</p>
                  )}
                  {user.work && (
                    <p className="text-sm text-gray-600">{user.work}</p>
                  )}
                </div>
              </div>

              {user.bio && (
                <p className="text-gray-700 mb-4 line-clamp-3">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {user.feelingToday?.map((mood) => (
                  <span
                    key={mood}
                    className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium"
                  >
                    {mood}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Request
                </button>
                <CallButton
                  receiverId={user.id}
                  receiverName={user.name}
                  className="px-4 py-2"
                />
                <button
                  onClick={() => {/* TODO: Navigate to direct message */}}
                  className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend Request Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Friend Request to {selectedUser.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message to introduce yourself..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Message (optional)
              </label>
              <div className="flex items-center gap-2">
                {!voiceFile && !isRecording && (
                  <button
                    onClick={startRecording}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Record Voice
                  </button>
                )}
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Stop Recording
                  </button>
                )}
                {voiceFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">Voice message recorded</span>
                    <button
                      onClick={() => setVoiceFile(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendFriendRequest(selectedUser.id)}
                disabled={sendingRequests.has(selectedUser.id)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {sendingRequests.has(selectedUser.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchList; 