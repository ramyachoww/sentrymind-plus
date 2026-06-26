import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { SleepLog, WorkoutLog, Mood, Page } from '../types';
import LogSleepModal from './LogSleepModal';
import LogWorkoutModal from './LogWorkoutModal';
import ConnectWatchModal from './ConnectWatchModal';
import AchievementBadge from './AchievementBadge';
import EditGoalModal from './EditGoalModal';
import { useRewards } from '../contexts/RewardContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getWellnessInsights } from '../services/geminiService';

// Helper to check if a log's date is today
const isToday = (dateString: string) => {
    const logDate = new Date(dateString);
    const today = new Date();
    return logDate.getDate() === today.getDate() &&
        logDate.getMonth() === today.getMonth() &&
        logDate.getFullYear() === today.getFullYear();
};

const TrackerCard: React.FC<{title: string, value: string, unit: string, icon: React.ReactNode, onClick: () => void}> = ({title, value, unit, icon, onClick}) => (
    <button onClick={onClick} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md w-full text-left transition-transform hover:scale-105 active:scale-95">
        <div className="flex items-center space-x-3">
            <div className="text-[#3A5A40] dark:text-green-300 text-2xl bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">{title}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {value} <span className="text-sm font-normal text-gray-600 dark:text-gray-300">{unit}</span>
                </p>
            </div>
        </div>
    </button>
)

const LiveDataPoint: React.FC<{label: string; value: string | number; unit: string; icon: React.ReactNode}> = ({label, value, unit, icon}) => (
    <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex flex-col items-center justify-center space-y-1">
        <div className="text-2xl text-[#3A5A40] dark:text-green-300">{icon}</div>
        <div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {value}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

interface TrackerScreenProps {
    setPage: (page: Page) => void;
}

const TrackerScreen: React.FC<TrackerScreenProps> = ({ setPage }) => {
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  const { addReward } = useRewards();
  const { isPremium } = useSubscription();
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLog[]>('sleepLogs', []);
  const [workoutLogs, setWorkoutLogs] = useLocalStorage<WorkoutLog[]>('workoutLogs', []);
  const [connectedDevice, setConnectedDevice] = useLocalStorage<string | null>('connectedDevice', null);
  const [customStepGoal, setCustomStepGoal] = useLocalStorage<number>('customStepGoal', 10000);
  const [lastSleepStreakReward, setLastSleepStreakReward] = useLocalStorage('lastSleepStreakReward', '');
  const [moods] = useLocalStorage<Mood[]>('moods', []);
  const [mindfulnessLogs] = useLocalStorage<string[]>('mindfulnessLogs', []);

  const [insights, setInsights] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  const [steps, setSteps] = useLocalStorage('simulatedSteps', 0);
  const [heartRate, setHeartRate] = useState(68);
  const [activeCalories, setActiveCalories] = useLocalStorage('simulatedCalories', 0);
  const [readinessScore, setReadinessScore] = useState(88);

  const [achievements, setAchievements] = useState({
    dailyMover: false,
    mindfulMoment: false,
    moodCheckIn: false,
  });

  const checkSleepStreak = (allLogs: SleepLog[]) => {
    const today = new Date().toISOString().split('T')[0];
    if (lastSleepStreakReward === today) return; // Already awarded today

    const uniqueLogDays = new Set(allLogs.map(l => l.date.split('T')[0]));
    let streak = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (uniqueLogDays.has(dateStr)) {
            streak++;
        } else {
            break;
        }
    }

    if (streak >= 7) {
        addReward(10, '7-Day Sleep Streak');
        setLastSleepStreakReward(today);
    }
  };

  const handleSaveSleep = (log: Omit<SleepLog, 'id' | 'date'>) => {
      const newLog = { ...log, id: Date.now(), date: new Date().toISOString() };
      const newLogs = [newLog, ...sleepLogs];
      setSleepLogs(newLogs);
      setIsSleepModalOpen(false);
      checkSleepStreak(newLogs);
  };

  const handleSaveWorkout = (log: Omit<WorkoutLog, 'id' | 'date'>) => {
      const newLog = { ...log, id: Date.now(), date: new Date().toISOString() };
      setWorkoutLogs([newLog, ...workoutLogs]);
      setIsWorkoutModalOpen(false);
      addReward(3, 'Physical Activity');
  };
  
  const handleSaveGoal = (newGoal: number) => {
    setCustomStepGoal(newGoal);
    setIsGoalModalOpen(false);
  };

  const handleConnectWatch = (deviceName: string) => {
    const startSleep = new Date();
    startSleep.setDate(startSleep.getDate() - 1);
    startSleep.setHours(22, 15, 0, 0);

    const endSleep = new Date();
    endSleep.setHours(6, 30, 0, 0);

    const mockSleepLog: SleepLog = {
      id: Date.now(),
      startTime: startSleep.toISOString(),
      endTime: endSleep.toISOString(),
      date: new Date().toISOString(),
      notes: `Synced from ${deviceName}`
    };

    const mockWorkoutLog: WorkoutLog = {
      id: Date.now() + 1,
      type: 'PT',
      duration: 55,
      notes: `Synced from ${deviceName}`,
      date: new Date().toISOString(),
    };
    
    setSleepLogs(prev => [mockSleepLog, ...prev.filter(l => !isToday(l.date) || !l.notes?.includes('Synced from'))]);
    setWorkoutLogs(prev => [mockWorkoutLog, ...prev.filter(l => !isToday(l.date) || !l.notes?.includes('Synced from'))]);
    setConnectedDevice(deviceName);
    // Reset simulated data on new connection
    setSteps(Math.floor(Math.random() * 2000) + 6000); // Start with a realistic number
    setActiveCalories(Math.floor(Math.random() * 100) + 250);
    setIsWatchModalOpen(false);
  };

  const handleDisconnectWatch = () => {
    setConnectedDevice(null);
  };

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsights('');
    const result = await getWellnessInsights(moods, sleepLogs, workoutLogs);
    setInsights(result);
    setIsGeneratingInsights(false);
  };
  
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      if (!connectedDevice) return;
      setSteps(prevSteps => prevSteps + Math.floor(Math.random() * 4) + 1);
      setHeartRate(prevRate => Math.max(65, Math.min(85, prevRate + Math.floor(Math.random() * 5) - 2)));
      setActiveCalories(prev => prev + Math.floor(Math.random() * 2));
      setReadinessScore(prev => Math.max(75, Math.min(95, prev + Math.floor(Math.random() * 3) - 1)));
    }, 4000);
    return () => clearInterval(simulationInterval);
  }, [connectedDevice, setSteps, setActiveCalories]);

  useEffect(() => {
    const checkAchievements = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        setAchievements({
            dailyMover: steps >= customStepGoal,
            mindfulMoment: mindfulnessLogs.includes(todayStr),
            moodCheckIn: moods.some(mood => mood.date.startsWith(todayStr)),
        });
    };
    checkAchievements();
  }, [moods, mindfulnessLogs, steps, customStepGoal]);

  const calculateSleepDuration = (log: SleepLog): { hours: number, minutes: number } | null => {
      if (!log) return null;
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      let diffMs = end.getTime() - start.getTime();
      if (diffMs < 0) {
        const nextDayEnd = new Date(end);
        nextDayEnd.setDate(nextDayEnd.getDate() + 1);
        diffMs = nextDayEnd.getTime() - start.getTime();
      }
      const diffMins = Math.round(diffMs / 60000);
      return { hours: Math.floor(diffMins / 60), minutes: diffMins % 60 };
  };
  
  const getTodaysLogs = <T extends { date: string }>(logs: T[]): T | undefined => logs.find(log => isToday(log.date));

  const todaysSleep = getTodaysLogs(sleepLogs);
  const todaysWorkout = getTodaysLogs(workoutLogs);
  const sleepDuration = calculateSleepDuration(todaysSleep!);

  const dailyMoverDescription = achievements.dailyMover
    ? `${customStepGoal.toLocaleString()} Steps - Goal Met`
    : `${steps.toLocaleString()} / ${customStepGoal.toLocaleString()} steps`;

  return (
    <>
        <div className="p-6 space-y-6 bg-[#F8F5F2] dark:bg-gray-900 min-h-full">
            <header>
                <h1 className="text-3xl font-bold text-[#3A5A40] dark:text-green-300">Health Tracker</h1>
                <p className="text-gray-600 dark:text-gray-400">Monitor your activity and rest.</p>
            </header>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4 relative">
                {!isPremium && 
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl p-4 text-center">
                        <span className="text-4xl mb-2">🔒</span>
                        <p className="font-bold text-gray-700 dark:text-gray-100">Unlock AI Insights</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upgrade to get personalized wellness reports.</p>
                        <button onClick={() => setPage('plans')} className="bg-amber-500 text-white font-bold py-2 px-6 rounded-full shadow-md hover:bg-amber-600 transition">
                            Upgrade to Unlock
                        </button>
                    </div>
                }
                
                <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">AI-Powered Insights</h2>
                    <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">PREMIUM</span>
                </div>

                {insights ? (
                    <div className="text-gray-700 dark:text-gray-300 text-sm space-y-2 whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-700 rounded-md">{insights}</div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Get AI-driven analysis of your mood, sleep, and activity patterns to discover what impacts your well-being.</p>
                )}
                
                <button
                    onClick={handleGenerateInsights}
                    disabled={isGeneratingInsights || !isPremium}
                    className="w-full bg-[#3A5A40] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#588157] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isGeneratingInsights ? 'Analyzing...' : (insights ? 'Regenerate Insights' : 'Generate My Insights')}
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Your Manual Logs</h2>
                <div className="grid grid-cols-2 gap-4">
                    <TrackerCard 
                        title="Log Sleep" 
                        value={sleepDuration ? String(sleepDuration.hours) : '--'} 
                        unit={sleepDuration ? `hr ${sleepDuration.minutes}m` : 'Not Logged'}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>}
                        onClick={() => setIsSleepModalOpen(true)}
                    />
                    <TrackerCard 
                        title="Log Activity" 
                        value={todaysWorkout ? String(todaysWorkout.duration) : '--'} 
                        unit={todaysWorkout ? 'min' : 'Not Logged'}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-3.797A8.33 8.33 0 0 1 15.362 5.214Z" /></svg>}
                        onClick={() => setIsWorkoutModalOpen(true)}
                    />
                </div>
            </div>

            {connectedDevice ? (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Live Data Sync</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Connected to: <span className="font-bold">{connectedDevice}</span></p>
                        </div>
                        <button onClick={handleDisconnectWatch} className="text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full hover:bg-red-200 transition">Disconnect</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                         <LiveDataPoint label="Steps" value={steps.toLocaleString()} unit="" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg>} />
                        <LiveDataPoint label="Heart Rate" value={heartRate} unit=" bpm" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>} />
                        <LiveDataPoint label="Active" value={activeCalories} unit=" kcal" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>} />
                        <LiveDataPoint label="Readiness" value={readinessScore} unit="%" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} />
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-3 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Smartwatch Sync</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Connect your smartwatch to sync data automatically.</p>
                    <button
                        onClick={() => setIsWatchModalOpen(true)}
                        className="bg-[#3A5A40] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#588157] transition-all duration-300 transform hover:-translate-y-1"
                    >
                        Connect Smartwatch
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Daily Goals</h2>
                    <button onClick={() => setIsGoalModalOpen(true)} className="text-sm font-semibold text-[#3A5A40] bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">Edit</button>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Your daily step goal is <span className="font-bold text-gray-800 dark:text-gray-100">{customStepGoal.toLocaleString()}</span> steps.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Today's Achievements</h2>
                <div className="space-y-3">
                    <AchievementBadge
                        title="Daily Mover"
                        description={dailyMoverDescription}
                        unlocked={achievements.dailyMover}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg>}
                    />
                    <AchievementBadge
                        title="Mindful Moment"
                        description="Completed a mindfulness exercise"
                        unlocked={achievements.mindfulMoment}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19A9.75 9.75 0 0 1 12 3c1.928 0 3.723.547 5.281 1.503l.23 1.018a.75.75 0 0 0 .73.693h2.365a.75.75 0 0 1 .73.818l-.23 1.018A9.75 9.75 0 0 1 12 21c-1.928 0-3.723-.547-5.281-1.503l-.23-1.018a.75.75 0 0 0-.73-.693H3.515a.75.75 0 0 1-.73-.818l.23-1.018A9.75 9.75 0 0 1 6.115 5.19Z" /></svg>}
                    />
                    <AchievementBadge
                        title="Mood Check-in"
                        description="Logged today's mood"
                        unlocked={achievements.moodCheckIn}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm4.5 0c0 .414-.168.75-.375.75s-.375-.414-.375-.75.168-.75.375-.75.375.336.375.75Z" /></svg>}
                    />
                </div>
            </div>
        </div>

        {isSleepModalOpen && <LogSleepModal onClose={() => setIsSleepModalOpen(false)} onSave={handleSaveSleep} />}
        {isWorkoutModalOpen && <LogWorkoutModal onClose={() => setIsWorkoutModalOpen(false)} onSave={handleSaveWorkout} />}
        {isWatchModalOpen && <ConnectWatchModal onClose={() => setIsWatchModalOpen(false)} onConnect={handleConnectWatch} customStepGoal={customStepGoal} />}
        {isGoalModalOpen && <EditGoalModal onClose={() => setIsGoalModalOpen(false)} onSave={handleSaveGoal} currentGoal={customStepGoal} />}
    </>
  );
};

export default TrackerScreen;