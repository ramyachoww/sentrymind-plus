import React, { useState } from 'react';

interface EditGoalModalProps {
  onClose: () => void;
  onSave: (newGoal: number) => void;
  currentGoal: number;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ onClose, onSave, currentGoal }) => {
  const [goal, setGoal] = useState(String(currentGoal));
  const [error, setError] = useState('');

  const handleSave = () => {
    const goalNum = parseInt(goal, 10);
    if (!goal || isNaN(goalNum) || goalNum <= 0) {
      setError('Please enter a valid, positive number for your goal.');
      return;
    }
    setError('');
    onSave(goalNum);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-4 animate-fade-in-up">
        <h2 className="text-xl font-semibold text-gray-800">Edit Step Goal</h2>
        
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Daily Steps</label>
          <input
            type="number"
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157]"
            placeholder="e.g., 10000"
          />
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

export default EditGoalModal;
