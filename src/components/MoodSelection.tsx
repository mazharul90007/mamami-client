import React, { useState } from 'react';
import { Mood } from '../types';
import { Heart, Smile, Frown, Coffee, Flame, Angry, Zap, Star, Sparkles } from 'lucide-react';

interface MoodSelectionProps {
  onMoodsSelected: (moods: Mood[]) => void;
  isLoading?: boolean;
}

const moodOptions: { value: Mood; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'HAPPY', label: 'Happy', icon: <Smile className="h-6 w-6" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'SAD', label: 'Sad', icon: <Frown className="h-6 w-6" />, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'CALM', label: 'Calm', icon: <Coffee className="h-6 w-6" />, color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'BORED', label: 'Bored', icon: <Zap className="h-6 w-6" />, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'ROMANTIC', label: 'Romantic', icon: <Heart className="h-6 w-6" />, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'FRUSTRATED', label: 'Frustrated', icon: <Angry className="h-6 w-6" />, color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'STRESSED', label: 'Stressed', icon: <Flame className="h-6 w-6" />, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'GRATEFUL', label: 'Grateful', icon: <Star className="h-6 w-6" />, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'FLIRTY', label: 'Flirty', icon: <Sparkles className="h-6 w-6" />, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'ANGRY', label: 'Angry', icon: <Angry className="h-6 w-6" />, color: 'bg-red-100 text-red-800 border-red-200' },
];

const MoodSelection: React.FC<MoodSelectionProps> = ({ onMoodsSelected, isLoading = false }) => {
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);

  const toggleMood = (mood: Mood) => {
    setSelectedMoods(prev => {
      if (prev.includes(mood)) {
        return prev.filter(m => m !== mood);
      } else {
        return [...prev, mood];
      }
    });
  };

  const handleFindMatches = () => {
    if (selectedMoods.length > 0) {
      onMoodsSelected(selectedMoods);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">How are you feeling today?</h2>
        <p className="text-gray-600">Select your current moods to find people who match your vibe</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {moodOptions.map((mood) => (
          <button
            key={mood.value}
            onClick={() => toggleMood(mood.value)}
            disabled={isLoading}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
              ${selectedMoods.includes(mood.value) 
                ? `${mood.color} border-current shadow-lg scale-105` 
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {mood.icon}
            <span className="text-sm font-medium">{mood.label}</span>
          </button>
        ))}
      </div>

      <div className="text-center">
        {selectedMoods.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Selected moods:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {selectedMoods.map((mood) => (
                <span
                  key={mood}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {moodOptions.find(m => m.value === mood)?.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleFindMatches}
          disabled={selectedMoods.length === 0 || isLoading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-colors
            ${selectedMoods.length > 0 && !isLoading
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? 'Finding matches...' : 'Find Matches'}
        </button>
      </div>
    </div>
  );
};

export default MoodSelection; 