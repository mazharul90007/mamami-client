import React, { useState, useEffect } from 'react';
import { Circle, ApiResponse } from '../types';
import { circlesAPI } from '../services/api';
import { Users, MessageCircle, Loader2 } from 'lucide-react';

interface CircleListProps {
  onCircleSelect?: (circleId: string) => void;
}

const CircleList: React.FC<CircleListProps> = ({ onCircleSelect }) => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Users className="h-4 w-4 mr-1" />
              Community Chat
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => onCircleSelect?.(circle.id)}
                className="flex items-center px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Join Chat
              </button>
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