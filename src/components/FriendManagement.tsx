import React, { useState, useEffect } from 'react';
import { User, FriendRequest } from '../types';
import { friendRequestAPI } from '../services/api';
import CallButton from './CallButton';
import { Check, X, UserMinus, MessageCircle, Play, Loader2, UserPlus } from 'lucide-react';

type TabType = 'friends' | 'pending' | 'sent';

interface FriendManagementProps {
  onSelectConversation?: (friendId: string) => void;
  friends?: User[];
  onFriendsUpdate?: () => void;
}

const FriendManagement: React.FC<FriendManagementProps> = ({ onSelectConversation, friends = [], onFriendsUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [pendingRes, sentRes] = await Promise.all([
        friendRequestAPI.getPendingRequests(),
        friendRequestAPI.getSentRequests()
      ]);

      if (pendingRes.success) setPendingRequests(pendingRes.data);
      if (sentRes.success) setSentRequests(sentRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load friend data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingActions(prev => new Set(prev).add(requestId));
    try {
      console.log('Accepting friend request:', requestId);
      const response = await friendRequestAPI.acceptFriendRequest(requestId);
      console.log('Accept response:', response);
      await loadData(); // Reload to update lists
    } catch (err: any) {
      console.error('Error accepting request:', err);
      setError(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingActions(prev => new Set(prev).add(requestId));
    try {
      await friendRequestAPI.rejectFriendRequest(requestId);
      await loadData(); // Reload to update lists
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    setProcessingActions(prev => new Set(prev).add(friendId));
    try {
      await friendRequestAPI.removeFriend(friendId);
      await loadData(); // Reload to update lists
      onFriendsUpdate?.(); // Notify parent to refresh friends list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove friend');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && activeTab !== 'friends') {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Friend Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'friends'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'pending'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'sent'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                <p className="text-gray-600">Start connecting with people to build your friend list</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        {friend.profilePhotoUrl ? (
                          <img
                            src={friend.profilePhotoUrl}
                            alt={friend.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-500">
                            {friend.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                        {friend.birthday && (
                          <p className="text-sm text-gray-600">{getAge(friend.birthday)} years old</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectConversation?.(friend.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </button>
                      <CallButton
                        receiverId={friend.id}
                        receiverName={friend.name}
                        variant="secondary"
                        size="sm"
                        className="px-3 py-2"
                      />
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={processingActions.has(friend.id)}
                        className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {processingActions.has(friend.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'pending' && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <UserPlus className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">You don't have any friend requests waiting</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        {request.sender.profilePhotoUrl ? (
                          <img
                            src={request.sender.profilePhotoUrl}
                            alt={request.sender.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-500">
                            {request.sender.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.sender.name}</h3>
                        <p className="text-sm text-gray-600">Sent {formatDate(request.createdAt)}</p>
                      </div>
                    </div>

                    {request.message && (
                      <p className="text-gray-700 mb-3">{request.message}</p>
                    )}

                    {request.voiceMessageUrl && (
                      <div className="mb-3">
                        <button className="flex items-center text-primary-600 hover:text-primary-700">
                          <Play className="h-4 w-4 mr-1" />
                          Play Voice Message
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={processingActions.has(request.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processingActions.has(request.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingActions.has(request.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {processingActions.has(request.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'sent' && (
          <>
            {sentRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <UserPlus className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
                <p className="text-gray-600">You haven't sent any friend requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        {request.receiver.profilePhotoUrl ? (
                          <img
                            src={request.receiver.profilePhotoUrl}
                            alt={request.receiver.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-500">
                            {request.receiver.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.receiver.name}</h3>
                        <p className="text-sm text-gray-600">Sent {formatDate(request.createdAt)}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    {request.message && (
                      <p className="text-gray-700 mb-3">{request.message}</p>
                    )}

                    {request.voiceMessageUrl && (
                      <div className="mb-3">
                        <button className="flex items-center text-primary-600 hover:text-primary-700">
                          <Play className="h-4 w-4 mr-1" />
                          Play Voice Message
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendManagement; 