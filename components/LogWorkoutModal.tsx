import React, { useState } from 'react';
import { WorkoutLog } from '../types';

interface LogWorkoutModalProps {
  onClose: () => void;
  onSave: (log: Omit<WorkoutLog, 'id' | 'date'>) => void;
}

const workoutOptions = ['Running', 'Ruck March', 'PT', 'Strength', 'Yoga'];

const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({ onClose, onSave }) => {
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const finalType = selectedType === 'Other' ? customType : selectedType;
    const durationNum = parseInt(duration, 10);
    if (!finalType || !duration || isNaN(durationNum) || durationNum <= 0) {
      setError('Please select a workout type and enter a valid duration.');
      return;
    }
    setError('');
    onSave({ type: finalType, duration: durationNum, notes });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-4 animate-fade-in-up">
        <h2 className="text-xl font-semibold text-gray-800">Log Your Workout</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workout Type</label>
          <div className="grid grid-cols-3 gap-2">
            {workoutOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedType(option)}
                className={`p-2 rounded-lg text-center font-semibold transition text-sm ${
                  selectedType === option
                    ? 'bg-[#3A5A40] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
             <button
                onClick={() => setSelectedType('Other')}
                className={`p-2 rounded-lg text-center font-semibold transition text-sm ${
                  selectedType === 'Other'
                    ? 'bg-[#3A5A40] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Other
              </button>
          </div>
          {selectedType === 'Other' && (
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157]"
              placeholder="Enter custom workout type"
            />
          )}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157]"
            placeholder="e.g., 30"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157]"
            placeholder="How did it feel?"
          ></textarea>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 transition">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-[#588157] text-white font-bold py-2 px-4 rounded-full hover:bg-[#3A5A40] transition">
            Save
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LogWorkoutModal;
