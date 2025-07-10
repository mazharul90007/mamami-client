import React, { useState, useEffect } from 'react';
import { Circle, ApiResponse } from '../types';
import { circlesAPI } from '../services/api';
import { Users, MessageCircle, Plus, Minus, Loader2 } from 'lucide-react';

const CircleList: React.FC = () => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningCircle, setJoiningCircle] = useState<string | null>(null);
  const [leavingCircle, setLeavingCircle] = useState<string | null>(null);

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Circle[]> = await circlesAPI.getAllCircles();
      if (response.success) {
        setCircles(response.data);
      } else {
        setError(response.message || 'Failed to fetch circles');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch circles');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    try {
      setJoiningCircle(circleId);
      const response = await circlesAPI.joinCircle(circleId);
      if (response.success) {
        // Refresh circles to update member status
        await fetchCircles();
      } else {
        setError(response.message || 'Failed to join circle');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join circle');
    } finally {
      setJoiningCircle(null);
    }
  };

  const handleLeaveCircle = async (circleId: string) => {
    try {
      setLeavingCircle(circleId);
      const response = await circlesAPI.leaveCircle(circleId);
      if (response.success) {
        // Refresh circles to update member status
        await fetchCircles();
      } else {
        setError(response.message || 'Failed to leave circle');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to leave circle');
    } finally {
      setLeavingCircle(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {circles.map((circle) => (
          <div
            key={circle.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {circle.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {circle.description}
                </p>
              </div>
              {circle.isMember && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Member
                </span>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Users className="h-4 w-4 mr-1" />
              {circle.memberCount} members
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => window.location.href = `/chat/${circle.id}`}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Open Chat
              </button>

              {circle.isMember ? (
                <button
                  onClick={() => handleLeaveCircle(circle.id)}
                  disabled={leavingCircle === circle.id}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50"
                >
                  {leavingCircle === circle.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Minus className="h-4 w-4 mr-1" />
                  )}
                  Leave
                </button>
              ) : (
                <button
                  onClick={() => handleJoinCircle(circle.id)}
                  disabled={joiningCircle === circle.id}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md disabled:opacity-50"
                >
                  {joiningCircle === circle.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Join
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {circles.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No circles available</h3>
          <p className="text-gray-600">Check back later for new communities!</p>
        </div>
      )}
    </div>
  );
};

export default CircleList; 