import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ClockPickerProps {
  onClose: () => void;
  onSave: (time: string) => void; // HH:mm format
  initialTime?: string; // HH:mm format
}

const ClockPicker: React.FC<ClockPickerProps> = ({ onClose, onSave, initialTime }) => {
  const [view, setView] = useState<'hours' | 'minutes'>('hours');
  
  const [hour, setHour] = useState(12); // 1-12. Using 0 as a temporary "empty" state.
  const [minute, setMinute] = useState(0); // 0-59
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  
  const clockRef = useRef<HTMLDivElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isDark = view === 'minutes';

  useEffect(() => {
    if (initialTime) {
      const [h, m] = initialTime.split(':').map(Number);
      const newPeriod = h >= 12 ? 'PM' : 'AM';
      let newHour = h % 12;
      if (newHour === 0) newHour = 12; // 0h (midnight) and 12h (noon) are both displayed as 12
      
      setHour(newHour);
      setMinute(m);
      setPeriod(newPeriod);
    }
  }, [initialTime]);

  const handleMinuteUpdate = useCallback((e: MouseEvent | TouchEvent) => {
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Adjust for 0 degrees at top

    const newMinute = Math.round(angle / 6) % 60;
    setMinute(newMinute);
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMinuteUpdate(e.nativeEvent);
  }, [handleMinuteUpdate]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        e.preventDefault();
      }
      handleMinuteUpdate(e);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleMinuteUpdate, handleDragEnd]);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
        setHour(0); // Use 0 as temporary empty state
        return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
        if (num > 12) {
            setHour(12);
        } else if (num < 0) {
            setHour(1);
        } else {
            setHour(num);
            if (String(num).length >= 2 || num > 1) {
                minuteInputRef.current?.focus();
                minuteInputRef.current?.select();
            }
        }
    }
  };

  const handleHourBlur = () => {
    if (hour === 0) {
        setHour(12);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      if (value === '') {
        setMinute(0);
        return;
      }
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
          if (num > 59) {
              setMinute(59);
          } else if (num < 0) {
              setMinute(0);
          } else {
              setMinute(num);
          }
      }
  };

  const handleHourSelect = (selectedHour: number) => {
    setHour(selectedHour);
    setView('minutes');
  };

  const handleMinuteSelect = (selectedMinute: number) => {
    setMinute(selectedMinute);
  };

  const handleSave = () => {
    let displayHour = hour === 0 ? 12 : hour;
    let finalHour = displayHour;
    
    if (period === 'PM' && displayHour !== 12) {
      finalHour += 12;
    }
    if (period === 'AM' && displayHour === 12) {
      finalHour = 0;
    }
    const formattedTime = `${String(finalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onSave(formattedTime);
  };

  const renderHours = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const effectiveHour = hour === 0 ? 12 : hour;
    const hourRotation = (effectiveHour * 30) + (minute * 0.5);

    return (
      <div className="relative w-56 h-56 rounded-full bg-gray-100 flex items-center justify-center my-4">
        <div
            className="absolute h-16 w-1 bg-[#588157] bottom-1/2 left-1/2 origin-bottom transition-transform duration-300 ease-in-out rounded-full pointer-events-none"
            style={{ transform: `translateX(-50%) rotate(${hourRotation}deg)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#588157] rounded-full border-4 border-white shadow-lg"></div>
        </div>
        <div className="absolute w-3 h-3 bg-[#588157] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"></div>
        
        {hours.map(h => {
            const isSelected = h === effectiveHour;
            // Angle in radians. 0 is at 3 o'clock, so subtract PI/2 to make 0 at 12 o'clock.
            const angle = (h * Math.PI / 6) - (Math.PI / 2); 
            const radius = 88; // 5.5rem in pixels
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
                <div
                    key={h}
                    className="absolute top-1/2 left-1/2 w-10 h-10 -m-5 z-20"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                    <button
                        onClick={() => handleHourSelect(h)}
                        className={`w-full h-full rounded-full flex items-center justify-center transition font-semibold text-lg ${isSelected ? 'bg-[#588157] text-white' : 'text-black hover:bg-green-100'}`}
                    >
                        {h}
                    </button>
                </div>
            )
        })}
      </div>
    );
  };

  const renderMinutes = () => {
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
    const closestMinute = Math.round(minute / 5) * 5;

    return (
      <div 
        ref={clockRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="relative w-56 h-56 rounded-full bg-gray-900 flex items-center justify-center my-4 touch-none cursor-grab active:cursor-grabbing"
      >
        <div
            className="absolute h-24 w-0.5 bg-gray-400 bottom-1/2 left-1/2 origin-bottom pointer-events-none"
            style={{ transform: `translateX(-50%) rotate(${minute * 6}deg)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#588157] rounded-full border-4 border-gray-900 shadow-lg"></div>
        </div>
        <div className="absolute w-3 h-3 bg-[#588157] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"></div>
        
        {minutes.map(m => {
            const isSelected = m === (closestMinute % 60);
            // Angle in radians.
            const angle = (m * Math.PI / 30) - (Math.PI / 2);
            const radius = 88;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
                <div
                    key={m}
                    className="absolute top-1/2 left-1/2 w-10 h-10 -m-5 z-20"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                    <button
                        onClick={() => handleMinuteSelect(m)}
                        className={`w-full h-full rounded-full flex items-center justify-center transition text-sm ${isSelected ? 'bg-[#588157] text-white' : 'text-gray-200 hover:bg-gray-700'}`}
                    >
                        {String(m).padStart(2, '0')}
                    </button>
                </div>
            )
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-lg p-4 w-full max-w-xs flex flex-col items-center space-y-2 animate-fade-in-up transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-baseline justify-center space-x-1 text-5xl font-light tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={hour === 0 ? '' : String(hour)}
                    onChange={handleHourChange}
                    onFocus={() => setView('hours')}
                    onBlur={handleHourBlur}
                    className={`w-20 px-2 py-1 rounded-md text-center bg-transparent outline-none transition-colors duration-200 ${view === 'hours' ? 'bg-green-100 text-[#3A5A40]' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                />
                <span>:</span>
                <input
                    ref={minuteInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={String(minute).padStart(2, '0')}
                    onChange={handleMinuteChange}
                    onFocus={(e) => {
                        setView('minutes');
                        e.target.select();
                    }}
                    className={`w-20 px-2 py-1 rounded-md text-center bg-transparent outline-none transition-colors duration-200 ${view === 'minutes' ? 'bg-green-100 text-[#3A5A40]' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                />
            </div>
            <div className={`flex flex-col text-sm border rounded-lg overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <button onClick={() => setPeriod('AM')} className={`px-3 py-1 transition ${period === 'AM' ? 'bg-[#588157] text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700')}`}>AM</button>
                <button onClick={() => setPeriod('PM')} className={`px-3 py-1 transition ${period === 'PM' ? 'bg-[#588157] text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700')}`}>PM</button>
            </div>
        </div>
        
        {view === 'hours' ? renderHours() : renderMinutes()}

        <div className={`flex justify-end space-x-2 pt-2 border-t w-full ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button onClick={onClose} className={`font-bold py-2 px-4 rounded-full transition ${isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
            Cancel
          </button>
          <button onClick={handleSave} className="bg-[#588157] text-white font-bold py-2 px-4 rounded-full hover:bg-[#3A5A40] transition">
            OK
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
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
  );
};

export default ClockPicker;