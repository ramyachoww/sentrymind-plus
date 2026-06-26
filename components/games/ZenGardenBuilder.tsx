import React, { useState, useEffect, useRef, useCallback } from 'react';
import PositiveThoughtModal from './PositiveThoughtModal';

interface ZenGardenBuilderProps {
    onGameComplete: (coinsEarned: number) => void;
    onBack: () => void;
}

interface GardenElement {
    id: number;
    type: string;
    x: number;
    y: number;
    size: number;
}

interface DragState {
    id: number;
    offsetX: number;
    offsetY: number;
}

const PALETTE = [
    { type: '🪨', size: 50 },
    { type: '⚫', size: 25 },
    { type: '🌱', size: 40 },
    { type: '🌸', size: 35 },
    { type: '🎍', size: 60 },
    { type: '🪵', size: 45 },
    { type: '🏮', size: 40 },
    { type: '🎏', size: 40 },
];

const ZenGardenBuilder: React.FC<ZenGardenBuilderProps> = ({ onGameComplete, onBack }) => {
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
    const [timeLeft, setTimeLeft] = useState(120);
    const [elements, setElements] = useState<GardenElement[]>([]);
    const [dragging, setDragging] = useState<DragState | null>(null);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const timerId = useRef<number | undefined>(undefined);

    const endGame = useCallback(() => {
        if (gameState !== 'playing') return;
        clearInterval(timerId.current);
        setGameState('over');
    }, [gameState]);

    const startGame = () => {
        setElements([]);
        setTimeLeft(120);
        setGameState('playing');
        timerId.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const getCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const handlePlaceNewElement = (item: { type: string, size: number }) => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const newElement: GardenElement = {
            id: Date.now(),
            type: item.type,
            size: item.size,
            x: rect.width / 2 - item.size / 2,
            y: rect.height / 2 - item.size / 2,
        };
        setElements(prev => [...prev, newElement]);
        // Immediately start dragging the new element
        setDragging({ id: newElement.id, offsetX: item.size / 2, offsetY: item.size / 2 });
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: number) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === id);
        if (!element || !gameAreaRef.current) return;

        const { x: clientX, y: clientY } = getCoords(e);
        const rect = gameAreaRef.current.getBoundingClientRect();
        
        const elementX = rect.left + element.x;
        const elementY = rect.top + element.y;
        
        const offsetX = clientX - elementX;
        const offsetY = clientY - elementY;
        
        setDragging({ id, offsetX, offsetY });
    };
    
    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragging || !gameAreaRef.current) return;

        const { x: clientX, y: clientY } = getCoords(e);
        const rect = gameAreaRef.current.getBoundingClientRect();

        let newX = clientX - rect.left - dragging.offsetX;
        let newY = clientY - rect.top - dragging.offsetY;

        setElements(prev =>
            prev.map(el => {
                if (el.id === dragging.id) {
                    // Clamp position to be within the garden bounds
                    const clampedX = Math.max(0, Math.min(newX, rect.width - el.size));
                    const clampedY = Math.max(0, Math.min(newY, rect.height - el.size));
                    return { ...el, x: clampedX, y: clampedY };
                }
                return el;
            })
        );
    }, [dragging]);

    const handleDragEnd = useCallback(() => {
        setDragging(null);
    }, []);
    
    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [dragging, handleDragMove, handleDragEnd]);
    
    useEffect(() => {
        return () => clearInterval(timerId.current);
    }, []);


    if (gameState === 'ready') {
        return (
            <div className="p-4 animate-fade-in flex flex-col h-full items-center justify-center text-center">
                <h1 className="text-3xl font-bold text-[#3A5A40]">Zen Garden Builder</h1>
                <p className="text-gray-600 my-4">Create a peaceful space. Select items from the palette and arrange them in your garden.</p>
                <button onClick={startGame} className="bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300">Start Designing</button>
                <button onClick={onBack} className="mt-4 text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-2 rounded-full">Back to Games</button>
            </div>
        );
    }
    
    const coinsEarned = 5 + elements.length;

    return (
        <div className="animate-fade-in flex flex-col h-full w-full">
            <header className="p-4 flex justify-between items-center text-lg font-semibold text-[#3A5A40] bg-white/30 backdrop-blur-sm z-10">
                <button onClick={onBack} className="text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-1 rounded-full flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span>Back</span>
                </button>
                <div className="tabular-nums font-bold">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <button onClick={endGame} className="text-sm font-semibold bg-[#588157] text-white px-4 py-1 rounded-full shadow-sm hover:bg-[#3A5A40]">
                    Finish
                </button>
            </header>

            <div className="flex-grow w-full relative" ref={gameAreaRef}>
                <div className="absolute inset-0 bg-[#E9E3D8] overflow-hidden">
                     {/* Sand texture pattern */}
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="sand" patternUnits="userSpaceOnUse" width="10" height="10">
                                <circle cx="1" cy="1" r="1" fill="#D1C7B8" fillOpacity="0.3"/>
                                <circle cx="6" cy="6" r="1" fill="#D1C7B8" fillOpacity="0.3"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#sand)" />
                    </svg>
                </div>
                {elements.map(el => (
                    <div
                        key={el.id}
                        onMouseDown={(e) => handleDragStart(e, el.id)}
                        onTouchStart={(e) => handleDragStart(e, el.id)}
                        className="absolute cursor-grab active:cursor-grabbing select-none flex items-center justify-center transition-shadow duration-300 rounded-full"
                        style={{
                            left: el.x,
                            top: el.y,
                            width: el.size,
                            height: el.size,
                            fontSize: `${el.size * 0.7}px`,
                            boxShadow: dragging?.id === el.id ? '0 10px 25px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.2)',
                            transform: dragging?.id === el.id ? 'scale(1.1)' : 'scale(1)',
                            zIndex: dragging?.id === el.id ? 10 : 1,
                        }}
                    >
                        {el.type}
                    </div>
                ))}
            </div>

            <div className="p-2 bg-white/50 backdrop-blur-sm flex flex-wrap justify-center items-center gap-2">
                {PALETTE.map(item => (
                    <button
                        key={item.type}
                        onClick={() => handlePlaceNewElement(item)}
                        className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-3xl hover:bg-green-100 active:scale-90 transition"
                    >
                        {item.type}
                    </button>
                ))}
            </div>

            {gameState === 'over' && <PositiveThoughtModal onClose={() => onGameComplete(coinsEarned)} coinsEarned={coinsEarned} />}
        </div>
    );
};

export default ZenGardenBuilder;