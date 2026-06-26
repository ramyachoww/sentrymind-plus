import React, { useState } from 'react';
import { SleepLog } from '../types';
import ClockPicker from './ClockPicker';

interface LogSleepModalProps {
  onClose: () => void;
  onSave: (log: Omit<SleepLog, 'id' | 'date'>) => void;
}

const formatTime12Hour = (time24: string): string => {
  if (!time24) return 'Select Time';
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const paddedMinutes = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${hours12}:${paddedMinutes} ${ampm}`;
};

const LogSleepModal: React.FC<LogSleepModalProps> = ({ onClose, onSave }) => {
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('06:00');
  const [error, setError] = useState('');
  const [pickerFor, setPickerFor] = useState<'start' | 'end' | null>(null);

  const handleSave = () => {
    if (!startTime || !endTime) {
      setError('Please select both a bed time and wake up time.');
      return;
    }
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);

    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);

    // If start time is "later" than end time, assume user went to bed yesterday
    // e.g., Bed time 22:00, Wake time 06:00
    if (start > end) {
      start.setDate(start.getDate() - 1);
    }
    
    if (end <= start) {
      setError('Wake up time must be after bed time.');
      return;
    }
    
    setError('');
    onSave({ startTime: start.toISOString(), endTime: end.toISOString() });
  };
  
  const handleSaveTime = (time: string) => {
    if (pickerFor === 'start') {
      setStartTime(time);
    } else if (pickerFor === 'end') {
      setEndTime(time);
    }
    setPickerFor(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-4 animate-fade-in-up">
          <h2 className="text-xl font-semibold text-gray-800">Log Your Sleep</h2>
          
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Bed Time</label>
            <button
                id="startTime"
                onClick={() => setPickerFor('start')}
                className="flex items-center justify-between w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#588157] group"
            >
                <span className="text-lg tabular-nums text-gray-700 px-1">
                  {formatTime12Hour(startTime)}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-[#588157] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
          
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Wake Up Time</label>
            <button
                id="endTime"
                onClick={() => setPickerFor('end')}
                className="flex items-center justify-between w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#588157] group"
            >
                <span className="text-lg tabular-nums text-gray-700 px-1">
                  {formatTime12Hour(endTime)}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-[#588157] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
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
          .tabular-nums {
            font-variant-numeric: tabular-nums;
          }
        `}</style>
      </div>

      {pickerFor && (
        <ClockPicker
            initialTime={pickerFor === 'start' ? startTime : endTime}
            onClose={() => setPickerFor(null)}
            onSave={handleSaveTime}
        />
      )}
    </>
  );
};

export default LogSleepModal;