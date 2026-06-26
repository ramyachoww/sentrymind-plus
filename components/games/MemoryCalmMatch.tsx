import React, { useState, useEffect, useMemo } from 'react';
import PositiveThoughtModal from './PositiveThoughtModal';

interface MemoryCalmMatchProps {
    onGameComplete: (coinsEarned: number) => void;
    onBack: () => void;
}

const ICONS = ['🌿', '💧', '☀️', '🌙', '⭐', '⛰️', '🌊', '🕊️'];

const MemoryCalmMatch: React.FC<MemoryCalmMatchProps> = ({ onGameComplete, onBack }) => {
    const [cards, setCards] = useState<{ id: number; icon: string; isFlipped: boolean; isMatched: boolean }[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [isGameWon, setIsGameWon] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const shuffleAndDeal = useMemo(() => {
        return [...ICONS, ...ICONS]
            .map((icon, index) => ({ icon, id: index, isFlipped: false, isMatched: false }))
            .sort(() => Math.random() - 0.5);
    }, []);
    
    useEffect(() => {
        setCards(shuffleAndDeal);
    }, [shuffleAndDeal]);

    const handleCardClick = (index: number) => {
        if (isChecking || cards[index].isFlipped || flippedIndices.length === 2) {
            return;
        }

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlippedIndices([...flippedIndices, index]);
    };

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            setMoves(prev => prev + 1);
            const [firstIndex, secondIndex] = flippedIndices;
            
            if (cards[firstIndex].icon === cards[secondIndex].icon) {
                // It's a match!
                const newCards = [...cards];
                newCards[firstIndex].isMatched = true;
                newCards[secondIndex].isMatched = true;

                // Check for win condition
                if (newCards.every(card => card.isMatched)) {
                    setTimeout(() => setIsGameWon(true), 500);
                }

                setCards(newCards);
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                // Not a match, flip back
                setTimeout(() => {
                    const newCards = [...cards];
                    newCards[firstIndex].isFlipped = false;
                    newCards[secondIndex].isFlipped = false;
                    setCards(newCards);
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    }, [flippedIndices, cards]);

    const handleModalClose = () => {
        setIsGameWon(false);
        onGameComplete(10); // Award 10 coins
    };

    return (
        <div className="p-4 animate-fade-in flex flex-col h-full">
            <header className="flex justify-between items-center mb-4">
                 <button onClick={onBack} className="text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-1 rounded-full flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span>Back</span>
                </button>
                <div className="text-right">
                    <h1 className="text-xl font-bold text-[#3A5A40]">Memory Calm Match</h1>
                </div>
            </header>
            
            <div className="flex-grow flex items-center justify-center">
                <div className="grid grid-cols-4 gap-3">
                    {cards.map((card, index) => (
                        <div key={card.id} className="w-16 h-16 sm:w-20 sm:h-20 [perspective:1000px]" onClick={() => handleCardClick(index)}>
                            <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${card.isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                                {/* Card Back */}
                                <div className="absolute w-full h-full bg-[#A3B18A] rounded-lg flex items-center justify-center [backface-visibility:hidden]">
                                    <div className="w-8 h-8 text-white/50">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                                    </div>
                                </div>
                                {/* Card Front */}
                                <div className={`absolute w-full h-full rounded-lg flex items-center justify-center text-3xl [transform:rotateY(180deg)] [backface-visibility:hidden] transition-opacity ${card.isMatched ? 'bg-green-200 opacity-50' : 'bg-white'}`}>
                                    {card.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center font-semibold text-lg text-gray-700 mt-4">
                Moves: <span className="font-bold text-[#3A5A40]">{moves}</span>
            </div>

            {isGameWon && <PositiveThoughtModal onClose={handleModalClose} coinsEarned={10} />}
        </div>
    );
};

export default MemoryCalmMatch;
