import React, { useState } from 'react';
import { useRewards } from '../contexts/RewardContext';
import MemoryCalmMatch from './games/MemoryCalmMatch';
import FocusBubblePop from './games/FocusBubblePop';
import ColorFlow from './games/ColorFlow';
import GratitudeCatcher from './games/GratitudeCatcher';
import ZenGardenBuilder from './games/ZenGardenBuilder';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Page } from '../types';

type GameId = 'memory' | 'bubble' | 'color' | 'gratitude' | 'zen';

interface GamesScreenProps {
    setPage: (page: Page) => void;
}

const PremiumStar: React.FC = () => (
    <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-1 shadow-md z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    </div>
);


const GameCard: React.FC<{ title: string; description: string; icon: string; onClick: () => void; isPremium?: boolean; isLocked?: boolean; }> = ({ title, description, icon, onClick, isPremium, isLocked }) => (
    <button
        onClick={onClick}
        className={`relative bg-white/80 p-4 rounded-2xl shadow-md flex items-center space-x-4 transition-all duration-300 w-full text-left
            ${!isLocked ? 'hover:scale-105 hover:bg-white active:scale-95' : 'opacity-60'}
        `}
    >
        <div className={`relative ${isLocked ? 'filter grayscale' : ''}`}>
             <div className="w-12 h-12 text-3xl rounded-full flex items-center justify-center bg-white/70">
                {icon}
            </div>
            {isPremium && <PremiumStar />}
        </div>
        <div className={isLocked ? 'filter grayscale' : ''}>
            <h3 className="font-semibold text-lg text-[#3A5A40]">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
        </div>
         {isLocked && <div className="absolute inset-0 flex items-center justify-end z-10 pr-6"><span className="text-3xl opacity-60">🔒</span></div>}
    </button>
);

const GamesScreen: React.FC<GamesScreenProps> = ({ setPage }) => {
    const [activeGame, setActiveGame] = useState<GameId | null>(null);
    const { totalCoins, addReward } = useRewards();
    const { isPremium } = useSubscription();

    const handleGameComplete = (coinsEarned: number) => {
        if (coinsEarned > 0) {
            addReward(coinsEarned, 'Calm Gaming');
        }
        setActiveGame(null); // Return to menu
    };
    
    const games = [
        { id: 'memory', title: 'Memory Calm Match', description: 'Pair soothing nature icons.', icon: '🧠', isPremium: false },
        { id: 'bubble', title: 'Focus Bubble Pop', description: 'Pop bubbles, calm your mind.', icon: '🫧', isPremium: false },
        { id: 'color', title: 'Color Flow', description: 'Fill patterns with gentle colors.', icon: '🎨', isPremium: false },
        { id: 'gratitude', title: 'Gratitude Catcher', description: 'Catch notes, feel positive.', icon: '🍂', isPremium: true },
        { id: 'zen', title: 'Zen Garden Builder', description: 'Create your own calm space.', icon: '🪴', isPremium: true },
    ];

    const gameComponents: Record<GameId, React.ReactNode> = {
        'memory': <MemoryCalmMatch onGameComplete={handleGameComplete} onBack={() => setActiveGame(null)} />,
        'bubble': <FocusBubblePop onGameComplete={handleGameComplete} onBack={() => setActiveGame(null)} />,
        'color': <ColorFlow onGameComplete={handleGameComplete} onBack={() => setActiveGame(null)} />,
        'gratitude': <GratitudeCatcher onGameComplete={handleGameComplete} onBack={() => setActiveGame(null)} />,
        'zen': <ZenGardenBuilder onGameComplete={handleGameComplete} onBack={() => setActiveGame(null)} />,
    };
    
    const renderContent = () => {
        if (!activeGame) {
            return (
                <div className="p-6 space-y-6 animate-fade-in">
                    <header>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-[#3A5A40]">Relax & Play</h1>
                                <p className="text-gray-600">Low-stress games to find your balance.</p>
                            </div>
                            <div className="text-center bg-amber-100/80 rounded-full px-4 py-2">
                                <div className="font-bold text-xl text-amber-700">{totalCoins}</div>
                                <div className="text-xs text-amber-600">COINS</div>
                            </div>
                        </div>
                    </header>
                    <div className="space-y-4">
                        {games.map(game => {
                            const isLocked = !!game.isPremium && !isPremium;
                            return (
                                <GameCard
                                    key={game.id}
                                    title={game.title}
                                    description={game.description}
                                    icon={game.icon}
                                    isPremium={game.isPremium}
                                    isLocked={isLocked}
                                    onClick={isLocked ? () => setPage('plans') : () => setActiveGame(game.id as GameId)}
                                />
                            );
                        })}
                    </div>
                </div>
            );
        }
        
        const selectedGameComponent = gameComponents[activeGame];
        if (selectedGameComponent) {
            return selectedGameComponent;
        }
        return null;
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-[#CAD2C5] via-[#F8F5F2] to-[#E9E3D8]">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
            {renderContent()}
        </div>
    );
};

export default GamesScreen;