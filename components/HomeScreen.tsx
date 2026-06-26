import React from 'react';
import { Page } from '../types';
import { useRewards } from '../contexts/RewardContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import ThemeToggle from './ThemeToggle';

interface HomeScreenProps {
  setPage: (page: Page) => void;
  onLogout: () => void;
}

const PremiumStar: React.FC = () => (
    <div className="absolute -top-2 -right-2 bg-amber-400 text-white rounded-full p-1 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    </div>
);

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; color: string; isPremium?: boolean; isLocked?: boolean; }> = ({ title, description, icon, onClick, color, isPremium, isLocked }) => (
  <button onClick={onClick} className={`relative bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-md flex items-center space-x-4 transition-transform w-full text-left ${isLocked ? '' : 'hover:scale-105 active:scale-95'}`}>
    <div className={`relative ${isLocked ? 'filter grayscale': ''}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {isPremium && <PremiumStar />}
    </div>
    <div className={isLocked ? 'opacity-50': ''}>
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 text-left">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm text-left">{description}</p>
    </div>
    {isLocked && <div className="absolute inset-0 flex items-center justify-end z-10 pr-6"><span className="text-3xl opacity-60">🔒</span></div>}
  </button>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ setPage, onLogout }) => {
  const { totalCoins } = useRewards();
  const { isPremium, isTrialActive, trialDaysRemaining } = useSubscription();

  return (
    <div className="p-6 space-y-8 bg-[#F8F5F2] dark:bg-gray-900 min-h-full">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#3A5A40] dark:text-green-300">Hey Soldier,</h1>
          <p className="text-gray-600 dark:text-gray-400">Ready to strengthen your mind today?</p>
        </div>
        <div className="flex items-center space-x-2">
          {isTrialActive && trialDaysRemaining != null && trialDaysRemaining > 0 ? (
             <div className="bg-green-100 text-green-800 font-bold py-2 px-4 rounded-full text-sm">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Day' : 'Days'} of Trial Left
            </div>
          ) : !isPremium && (
            <button
              onClick={() => setPage('plans')}
              className="bg-amber-400 text-white font-bold py-2 px-4 rounded-full shadow-sm hover:bg-amber-500 transition-transform hover:scale-105 text-sm"
            >
              Upgrade
            </button>
          )}
          <div className="text-center bg-amber-100/80 dark:bg-amber-800/50 rounded-full px-4 py-2 flex items-center space-x-2">
            <span className="font-bold text-xl text-amber-700 dark:text-amber-300">{totalCoins}</span>
            <span className="text-lg">🪙</span>
          </div>
          <ThemeToggle className="md:hidden" />
          <button
            onClick={onLogout}
            className="text-gray-500 dark:text-gray-400 hover:text-[#3A5A40] dark:hover:text-green-300 p-2 rounded-full transition-colors duration-200 md:hidden"
            aria-label="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">How are you feeling?</h2>
        <p className="text-gray-500 dark:text-gray-400">A quick check-in builds resilience. Let's log your mood for today.</p>
        <button 
          onClick={() => setPage('mood')}
          className="bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300 transform hover:-translate-y-1"
        >
          Check-In Now
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard 
          title="AI Therapist" 
          description="Talk through what's on your mind." 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
          onClick={() => setPage('chat')}
          color="bg-sky-200"
        />
        <FeatureCard 
          title="Resilience Missions" 
          description="Gamified mental strength challenges." 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          onClick={isPremium ? () => setPage('missions') : () => setPage('plans')}
          color="bg-red-300"
          isPremium
          isLocked={!isPremium}
        />
        <FeatureCard 
          title="Mood Insights" 
          description="AI analysis of your wellness data." 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          onClick={isPremium ? () => setPage('tracker') : () => setPage('plans')}
          color="bg-indigo-300"
          isPremium
          isLocked={!isPremium}
        />
        <FeatureCard 
          title="Daily Journal" 
          description="Reflect on your day with a prompt." 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
          onClick={() => setPage('journal')}
          color="bg-orange-200"
        />
        <FeatureCard 
          title="Breathe" 
          description="Reset with a 1-minute breathing exercise." 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          onClick={() => setPage('exercises')}
          color="bg-teal-200"
        />
        <FeatureCard 
          title="Relax & Play"
          description="Unwind with calm, low-stress games."
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
          onClick={() => setPage('games')}
          color="bg-purple-200"
        />
         <FeatureCard 
          title="Treasure Box" 
          description="View your earned coins and rewards." 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 10l8 4m0 0l8-4m-8 4V7" /></svg>}
          onClick={() => setPage('treasure')}
          color="bg-amber-300"
        />
        <FeatureCard 
          title="Voices from the Field"
          description="Share feedback and read experiences."
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          onClick={() => setPage('feedback')}
          color="bg-blue-200"
        />
      </div>
    </div>
  );
};

export default HomeScreen;