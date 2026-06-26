import React, { useState, useEffect } from 'react';
import { useRewards } from '../contexts/RewardContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Page } from '../types';

interface TreasureBoxScreenProps {
    setPage: (page: Page) => void;
}

const TreasureBoxScreen: React.FC<TreasureBoxScreenProps> = ({ setPage }) => {
    const { rewards, totalCoins, rank, addReward } = useRewards();
    const { isPremium } = useSubscription();
    const [isChestOpen, setIsChestOpen] = useState(false);

    // --- Daily Bonus State ---
    const [lastClaimDate, setLastClaimDate] = useLocalStorage('lastDailyBonusClaim', '');
    const [canClaimBonus, setCanClaimBonus] = useState(false);

    // --- Spin Wheel State ---
    const [lastSpinDate, setLastSpinDate] = useLocalStorage('lastSpinDate', '');
    const [canSpin, setCanSpin] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinRotation, setSpinRotation] = useState(0);

    const prizes = [5, 1, 10, 2, 3, 0, 5, 2]; // 8 segments
    const segmentAngle = 360 / prizes.length;

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (lastClaimDate !== today) {
            setCanClaimBonus(true);
        }
        if (lastSpinDate !== today) {
            setCanSpin(true);
        }
    }, [lastClaimDate, lastSpinDate]);

    const handleClaimDailyBonus = () => {
        if (!canClaimBonus) return;
        const today = new Date().toISOString().split('T')[0];
        addReward(5, "Daily Bonus");
        setLastClaimDate(today);
        setCanClaimBonus(false);
    };

    const handleSpin = () => {
        if (!canSpin || isSpinning) return;

        setIsSpinning(true);
        const randomIndex = Math.floor(Math.random() * prizes.length);
        const prize = prizes[randomIndex];
        
        const randomOffset = (Math.random() * 0.8 + 0.1) * segmentAngle;
        const prizeAngle = (randomIndex * segmentAngle) + randomOffset;
        
        // The target angle on the wheel (0-360) that should be at the top.
        // To bring a segment at angle `prizeAngle` to the top (0), we need to rotate
        // the wheel clockwise by `360 - prizeAngle`.
        const targetAngle = (360 - prizeAngle) % 360;

        setSpinRotation(prevRotation => {
            const currentAngle = prevRotation % 360;
            let diff = targetAngle - currentAngle;
            if (diff < 0) {
                diff += 360;
            }
            // Add 4 full spins for the animation
            const deltaRotation = (4 * 360) + diff;
            return prevRotation + deltaRotation;
        });

        setTimeout(() => {
            if (prize > 0) {
                addReward(prize, "Spin & Win Prize");
            }
            const today = new Date().toISOString().split('T')[0];
            setLastSpinDate(today);
            setCanSpin(false);
            setIsSpinning(false);
        }, 4000); // Must match animation duration
    };
    
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const rankColors: Record<string, string> = {
        'Calm Cadet': 'bg-gray-200 text-gray-800',
        'Mindful Warrior': 'bg-green-200 text-green-800',
        'Resilient Guardian': 'bg-sky-200 text-sky-800',
        'Peace Commander': 'bg-amber-200 text-amber-800',
    };

    return (
        <div className="p-6 space-y-6 bg-[#F8F5F2] min-h-full">
            <style>{`
                .chest { transition: transform 0.3s ease-in-out; }
                .chest:active { transform: scale(0.95); }
                @keyframes sparkle-burst {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .sparkle { 
                    position: absolute;
                    font-size: 1rem;
                    color: #D4AF37;
                    pointer-events: none;
                    animation: sparkle-burst 0.5s ease-out forwards;
                }
            `}</style>

            <header>
                <h1 className="text-3xl font-bold text-[#3A5A40]">Treasure Box</h1>
                <p className="text-gray-600">Your collection of earned rewards.</p>
            </header>

            <div className="bg-[#F5F3E7] p-6 rounded-2xl shadow-lg text-center space-y-4">
                <div className="relative inline-block">
                    <button
                        onClick={() => setIsChestOpen(prev => !prev)}
                        className="text-7xl chest"
                    >
                        {isChestOpen ? '🗃️' : '📦'}
                    </button>
                    {isChestOpen && Array.from({length: 10}).map((_, i) => (
                         <div
                            key={i}
                            className="sparkle"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: `rotate(${Math.random() * 360}deg) translateX(${Math.random() * 50}px)`,
                                animationDelay: `${Math.random() * 0.2}s`,
                            }}
                        >✨</div>
                    ))}
                </div>

                <div className="flex items-center justify-center space-x-2">
                    <span className="text-5xl font-bold text-[#4A6C4F]">{totalCoins}</span>
                    <span className="text-4xl" style={{color: '#D4AF37'}}>🪙</span>
                </div>
                 <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${rankColors[rank] || 'bg-gray-200'}`}>
                    {rank}
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-lg space-y-3">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">🎁</span>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Daily Bonus</h2>
                            <p className="text-sm text-gray-500">Claim your free coins once a day!</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClaimDailyBonus}
                        disabled={!canClaimBonus}
                        className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300 transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {canClaimBonus ? 'Claim 5 Coins' : 'Claimed for today'}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4 text-center">
                    <div className="flex items-center justify-center space-x-3">
                        <span className="text-3xl">🎡</span>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Spin & Win</h2>
                            <p className="text-sm text-gray-500">Try your luck once a day for a prize!</p>
                        </div>
                    </div>

                    <div className="relative w-56 h-56 mx-auto my-4 flex items-center justify-center">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 
                            border-l-8 border-l-transparent
                            border-r-8 border-r-transparent
                            border-t-[16px] border-t-red-500 z-10 drop-shadow-md"></div>
                        
                        <div
                            className="relative w-full h-full rounded-full border-4 border-amber-300 shadow-inner overflow-hidden"
                            style={{
                                background: 'conic-gradient(#a3b18a 0deg 45deg, #cad2c5 45deg 90deg, #588157 90deg 135deg, #f8f5f2 135deg 180deg, #a3b18a 180deg 225deg, #cad2c5 225deg 270deg, #588157 270deg 315deg, #f8f5f2 315deg 360deg)',
                                transition: 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                transform: `rotate(${spinRotation}deg)`
                            }}
                        >
                            {prizes.map((prize, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1/2 h-1/2 top-0 left-1/2 origin-bottom-left flex items-center justify-center"
                                    style={{ transform: `rotate(${i * segmentAngle + segmentAngle / 2}deg)` }}
                                >
                                    <span
                                        className="font-bold text-lg text-white text-shadow"
                                        style={{ transform: `rotate(-90deg) translateY(-200%)`, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                                    >
                                        {prize}
                                    </span>
                                </div>
                            ))}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-md"></div>
                        </div>
                    </div>

                    <button
                        onClick={handleSpin}
                        disabled={!canSpin || isSpinning}
                        className="w-full bg-[#A3B18A] text-[#3A5A40] font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#CAD2C5] transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSpinning ? 'Spinning...' : (canSpin ? 'Spin for a Prize!' : 'Come back tomorrow!')}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Rewards</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {rewards.length > 0 ? (
                        rewards.slice(0, 10).map(reward => (
                            <div key={reward.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#A3B18A] flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{reward.reason}</p>
                                    <p className="text-xs text-gray-500">{formatDate(reward.timestamp)}</p>
                                </div>
                                <div className="font-bold text-lg" style={{color: '#D4AF37'}}>
                                    +{reward.coins} 🪙
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No rewards earned yet. Keep checking in!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TreasureBoxScreen;