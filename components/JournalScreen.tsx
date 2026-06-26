import React, { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { JournalEntry } from '../types';
import { useRewards } from '../contexts/RewardContext';

const JOURNAL_PROMPTS = [
  "What was the high point of your day today?",
  "Describe a challenge you faced and how you handled it.",
  "What is something you're grateful for right now?",
  "Write about something that made you smile today.",
  "What's one thing you can do tomorrow to move closer to a goal?",
  "Reflect on a moment where you felt at peace.",
  "Who did you connect with today, and what did you talk about?",
  "What's a worry on your mind? Write it down to let it go.",
  "Describe one thing you learned today.",
  "What act of kindness, big or small, did you witness or perform?"
];

const CalendarView: React.FC<{
    entries: JournalEntry[];
    selectedDate: Date | null;
    onDateSelect: (date: Date | null) => void;
}> = ({ entries, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const entryDates = useMemo(() => new Set(entries.map(e => e.date.split('T')[0])), [entries]);

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const daysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();
        
        const blanks = Array(firstDay).fill(null);
        const monthDays = Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
        
        return [...blanks, ...monthDays];
    };

    const isSameDay = (d1: Date, d2: Date | null) => {
        if (!d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };
    
    const toISODateString = (date: Date) => date.toISOString().split('T')[0];

    return (
        <div className="bg-white p-4 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="font-semibold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {daysInMonth().map((day, index) => (
                    day ? (
                        <button
                            key={index}
                            onClick={() => onDateSelect(day)}
                            className={`relative h-9 w-9 rounded-full text-sm transition-colors ${
                                isSameDay(day, selectedDate)
                                    ? 'bg-[#588157] text-black'
                                    : 'text-black hover:bg-gray-100'
                            } ${
                                isSameDay(day, new Date()) ? 'font-bold' : ''
                            }`}
                        >
                            {day.getDate()}
                            {entryDates.has(toISODateString(day)) && (
                                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${isSameDay(day, selectedDate) ? 'bg-white' : 'bg-[#A3B18A]'}`}></div>
                            )}
                        </button>
                    ) : <div key={index}></div>
                ))}
            </div>
        </div>
    );
};


const JournalScreen: React.FC = () => {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('journalEntries', []);
  const { addReward } = useRewards();
  const [currentText, setCurrentText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState('');
  const [showReminderInput, setShowReminderInput] = useState(false);

  const scheduleNotification = async (entry: JournalEntry) => {
    if (!entry.reminder) return;
    const reminderDate = new Date(entry.reminder);
    if (reminderDate <= new Date()) return;

    if ('Notification' in window) {
      const schedule = () => {
        const delay = reminderDate.getTime() - new Date().getTime();
        if (delay > 0) {
          setTimeout(() => {
            new Notification('SentryMind+ Reminder', {
              body: `Remember your entry: "${entry.prompt}"`,
              tag: `journal-${entry.id}`,
            });
          }, delay);
        }
      };

      if (Notification.permission === 'granted') {
        schedule();
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          schedule();
        }
      }
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('reminders_scheduled')) return;

    entries.forEach(entry => {
      if (entry.reminder && new Date(entry.reminder) > new Date()) {
        scheduleNotification(entry);
      }
    });
    sessionStorage.setItem('reminders_scheduled', 'true');
  }, [entries]);

  const dailyPrompt = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];
  }, []);

  const todayISO = new Date().toISOString().split('T')[0];
  const todaysEntry = useMemo(() => entries.find(e => e.date.startsWith(todayISO)), [entries, todayISO]);

  const filteredEntries = useMemo(() => {
    if (!selectedDate) {
        return entries.filter(e => !e.date.startsWith(todayISO));
    }
    const selectedISO = selectedDate.toISOString().split('T')[0];
    return entries.filter(e => e.date.startsWith(selectedISO));
  }, [entries, selectedDate, todayISO]);

  const handleSave = () => {
    if (currentText.trim() === '') return;

    const newEntry: JournalEntry = {
      id: Date.now(),
      prompt: dailyPrompt,
      text: currentText.trim(),
      date: new Date().toISOString(),
      reminder: reminderTime || undefined,
    };

    setEntries([newEntry, ...entries]);
    if (newEntry.reminder) {
      scheduleNotification(newEntry);
    }

    addReward(2, "Daily Reflection");
    setCurrentText('');
    setReminderTime('');
    setShowReminderInput(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6 bg-[#F8F5F2] min-h-full">
      <header>
        <h1 className="text-3xl font-bold text-[#3A5A40]">Daily Journal</h1>
        <p className="text-gray-600">Reflect on your day, build self-awareness.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Today's Reflection</h2>
        <p className="text-sm text-gray-500">{formatDate(new Date().toISOString())}</p>
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#A3B18A]">
          <p className="font-semibold text-gray-700">{dailyPrompt}</p>
        </div>

        {todaysEntry ? (
          <div>
            <p className="font-semibold text-gray-800 mb-2">Your entry for today:</p>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-100 p-4 rounded-md">{todaysEntry.text}</p>
            {todaysEntry.reminder && (
                 <div className={`mt-2 p-2 rounded-md text-xs flex items-center space-x-2 ${new Date(todaysEntry.reminder) > new Date() ? 'bg-amber-100/60 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Reminder: {new Date(todaysEntry.reminder).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
            <p className="text-sm text-center text-green-700 font-semibold mt-4">You've completed your journal for today. Well done.</p>
          </div>
        ) : (
          <>
            <textarea
              rows={6}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157] focus:border-[#588157] transition"
              placeholder="Write your thoughts here..."
            />
            <div className="mt-2">
                {!showReminderInput ? (
                    <button
                    onClick={() => setShowReminderInput(true)}
                    className="flex items-center space-x-2 text-sm text-[#3A5A40] font-semibold hover:bg-gray-100 p-2 rounded-md transition"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Set a Reminder</span>
                    </button>
                ) : (
                    <div className="flex items-center space-x-2 animate-fade-in">
                        <input
                            type="datetime-local"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157]"
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        <button onClick={() => { setReminderTime(''); setShowReminderInput(false); }} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>
            <button
              onClick={handleSave}
              disabled={currentText.trim() === ''}
              className="w-full mt-4 bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300 transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {showSuccess ? 'Saved!' : 'Save Entry'}
            </button>
          </>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Past Entries</h2>
        <CalendarView entries={entries} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        
        {selectedDate && (
             <div className="text-center">
                <button onClick={() => setSelectedDate(null)} className="text-sm font-semibold text-[#3A5A40] bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition">
                    Show All Entries
                </button>
            </div>
        )}

        {entries.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-lg shadow animate-fade-in">
                <p className="text-sm font-semibold text-gray-500">{formatDate(entry.date)}</p>
                <p className="font-medium text-gray-700 mt-1 mb-2">"{entry.prompt}"</p>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{entry.text}</p>
                 {entry.reminder && (
                    <div className={`mt-2 p-2 rounded-md text-xs flex items-center space-x-2 ${new Date(entry.reminder) > new Date() ? 'bg-amber-100/60 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Reminder: {new Date(entry.reminder).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}
              </div>
            ))}
            {filteredEntries.length === 0 && selectedDate && (
                 <p className="text-gray-500 text-center py-4 bg-white rounded-lg shadow">No entry for this day.</p>
            )}
            {entries.filter(e => !e.date.startsWith(todayISO)).length === 0 && !todaysEntry && (
              <p className="text-gray-500 text-center py-4 bg-white rounded-lg shadow">No past entries yet. Start by writing one above!</p>
            )}
             {entries.filter(e => !e.date.startsWith(todayISO)).length === 0 && todaysEntry && (
              <p className="text-gray-500 text-center py-4 bg-white rounded-lg shadow">Come back tomorrow to see your past entries.</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4 bg-white rounded-lg shadow">No entries yet. Start by writing one above!</p>
        )}
      </div>
       <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default JournalScreen;