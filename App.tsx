import React, { useState } from 'react';
import BottomNav from './components/BottomNav';
import HomeScreen from './components/HomeScreen';
import MoodScreen from './components/MoodScreen';
import ChatScreen from './components/ChatScreen';
import ExercisesScreen from './components/ExercisesScreen';
import TrackerScreen from './components/TrackerScreen';
import LoginScreen from './components/LoginScreen';
import GamesScreen from './components/GamesScreen';
import JournalScreen from './components/JournalScreen';
import TreasureBoxScreen from './components/TreasureBoxScreen';
import FeedbackScreen from './components/FeedbackScreen';
import MissionsScreen from './components/MissionsScreen';
import PlansScreen from './components/PlansScreen';
import useLocalStorage from './hooks/useLocalStorage';
import { Page } from './types';
import { RewardProvider } from './contexts/RewardContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import RewardNotification from './components/RewardNotification';
import useMediaQuery from './hooks/useMediaQuery';
import SideNav from './components/SideNav';
import { ThemeProvider } from './contexts/ThemeContext';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomeScreen setPage={setCurrentPage} onLogout={handleLogout} />;
      case 'mood':
        return <MoodScreen setPage={setCurrentPage} />;
      case 'chat':
        return <ChatScreen setPage={setCurrentPage} />;
      case 'exercises':
        return <ExercisesScreen />;
      case 'tracker':
        return <TrackerScreen setPage={setCurrentPage} />;
      case 'games':
        return <GamesScreen setPage={setCurrentPage} />;
      case 'journal':
        return <JournalScreen />;
      case 'treasure':
        return <TreasureBoxScreen setPage={setCurrentPage} />;
      case 'feedback':
        return <FeedbackScreen />;
      case 'plans':
        return <PlansScreen setPage={setCurrentPage} />;
      case 'missions':
        return <MissionsScreen setPage={setCurrentPage} />;
      default:
        return <HomeScreen setPage={setCurrentPage} onLogout={handleLogout} />;
    }
  };

  if (isDesktop) {
    return (
      <div className="h-screen w-screen bg-[#F8F5F2] dark:bg-gray-900 flex justify-center items-center p-4">
        <div className="relative w-full max-w-6xl h-full max-h-[95vh] bg-[#FDFCFB] dark:bg-gray-800 shadow-2xl flex rounded-2xl overflow-hidden">
          <SideNav currentPage={currentPage} setPage={setCurrentPage} onLogout={handleLogout} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <RewardNotification />
            <main className="flex-1 overflow-y-auto">
              {renderPage()}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F8F5F2] dark:bg-gray-900 flex justify-center">
      <div className="relative w-full max-w-sm h-full bg-[#FDFCFB] dark:bg-gray-800 shadow-2xl flex flex-col">
        <RewardNotification />
        <main className="flex-1 overflow-y-auto pb-24">
          {renderPage()}
        </main>
        <BottomNav currentPage={currentPage} setPage={setCurrentPage} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <RewardProvider>
          <AppContent />
        </RewardProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
};

export default App;