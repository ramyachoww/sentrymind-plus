import React from 'react';
import { Page } from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';

interface UpgradeModalProps {
  featureName: string;
  description: string;
  onClose: () => void;
  setPage: (page: Page) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ featureName, description, onClose, setPage }) => {
  const { startTrial, hasUsedTrial } = useSubscription();

  const handleStartTrial = () => {
    startTrial();
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-40 flex justify-center items-center z-40 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center space-y-4 animate-fade-in-up">
        <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Unlock {featureName}</h2>
        <p className="text-gray-600">{description}</p>
        
        {!hasUsedTrial ? (
          <>
            <button
              onClick={handleStartTrial}
              className="w-full bg-[#588157] text-white font-bold py-3 px-4 rounded-full shadow-md hover:bg-[#3A5A40] transition"
            >
              Start 7-Day Free Trial
            </button>
            <button
              onClick={() => setPage('plans')}
              className="w-full mt-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-full shadow-md hover:bg-amber-600 transition"
            >
              Or View Plans
            </button>
          </>
        ) : (
          <button
            onClick={() => setPage('plans')}
            className="w-full bg-amber-500 text-white font-bold py-3 px-4 rounded-full shadow-md hover:bg-amber-600 transition"
          >
            Upgrade to Premium
          </button>
        )}

        <button onClick={onClose} className="mt-2 text-sm text-gray-500 hover:underline">
          Maybe Later
        </button>
      </div>
      <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default UpgradeModal;