import React, { useState, useEffect, useMemo, useRef } from 'react';
import PositiveThoughtModal from './PositiveThoughtModal';

interface ColorFlowProps {
    onGameComplete: (coinsEarned: number) => void;
    onBack: () => void;
}

type ShapeColors = Record<string, string>;

const PALETTE = ['#a3b18a', '#cad2c5', '#588157', '#3a5a40', '#f8f5f2'];
const DEFAULT_COLOR = '#E5E7EB';

// --- PATTERN COMPONENTS ---
const Pattern1: React.FC<{ colors: ShapeColors, onShapeClick: (id: string) => void }> = ({ colors, onShapeClick }) => (
    <svg viewBox="0 0 100 100" className="w-full h-auto cursor-pointer">
        <path d="M0 0 H50 V50 H0 Z" fill={colors['p1s1'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p1s1')} />
        <path d="M50 0 H100 V50 H50 Z" fill={colors['p1s2'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p1s2')} />
        <path d="M0 50 H50 V100 H0 Z" fill={colors['p1s3'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p1s3')} />
        <path d="M50 50 H100 V100 H50 Z" fill={colors['p1s4'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p1s4')} />
    </svg>
);

const Pattern2: React.FC<{ colors: ShapeColors, onShapeClick: (id: string) => void }> = ({ colors, onShapeClick }) => (
    <svg viewBox="0 0 100 100" className="w-full h-auto cursor-pointer">
        <path d="M0 0 L100 0 L50 50 Z" fill={colors['p2s1'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p2s1')} />
        <path d="M0 100 L100 100 L50 50 Z" fill={colors['p2s2'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p2s2')} />
        <path d="M0 0 L50 50 L0 100 Z" fill={colors['p2s3'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p2s3')} />
        <path d="M100 0 L50 50 L100 100 Z" fill={colors['p2s4'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p2s4')} />
    </svg>
);

const Pattern3: React.FC<{ colors: ShapeColors, onShapeClick: (id: string) => void }> = ({ colors, onShapeClick }) => (
    <svg viewBox="0 0 100 100" className="w-full h-auto cursor-pointer">
        <circle cx="50" cy="50" r="50" fill={colors['p3s1'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p3s1')} />
        <circle cx="50" cy="50" r="35" fill={colors['p3s2'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p3s2')} />
        <circle cx="50" cy="50" r="20" fill={colors['p3s3'] || DEFAULT_COLOR} stroke="#fff" strokeWidth="1" onClick={() => onShapeClick('p3s3')} />
    </svg>
);

const PATTERNS = [
    { component: Pattern1, shapes: ['p1s1', 'p1s2', 'p1s3', 'p1s4'] },
    { component: Pattern2, shapes: ['p2s1', 'p2s2', 'p2s3', 'p2s4'] },
    { component: Pattern3, shapes: ['p3s1', 'p3s2', 'p3s3'] },
];
// --- END PATTERN COMPONENTS ---

const ColorFlow: React.FC<ColorFlowProps> = ({ onGameComplete, onBack }) => {
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
    const [timeLeft, setTimeLeft] = useState(90);
    const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
    const [shapeColors, setShapeColors] = useState<ShapeColors>({});
    const [coinsEarned, setCoinsEarned] = useState(0);

    // FIX: The useRef hook with a generic type requires an initial value.
    const timerId = useRef<number | undefined>(undefined);

    const { pattern: PatternComponent, totalShapes } = useMemo(() => {
        const selected = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
        return { pattern: selected.component, totalShapes: selected.shapes.length };
    }, []);
    
    const filledShapes = Object.keys(shapeColors).length;
    const progress = (filledShapes / totalShapes) * 100;

    const startGame = () => {
        setShapeColors({});
        setTimeLeft(90);
        setGameState('playing');
        timerId.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const endGame = (isWin: boolean) => {
        clearInterval(timerId.current);
        if (isWin) {
            const calculatedCoins = 5 + Math.floor(timeLeft / 10);
            setCoinsEarned(calculatedCoins);
        } else {
            setCoinsEarned(0);
        }
        setGameState('over');
    };

    const handleShapeClick = (id: string) => {
        if (gameState !== 'playing') return;
        setShapeColors(prev => ({ ...prev, [id]: selectedColor }));
    };

    useEffect(() => {
        if (gameState === 'playing' && filledShapes === totalShapes) {
            endGame(true);
        }
    }, [shapeColors, gameState, totalShapes]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => clearInterval(timerId.current);
    }, []);

    if (gameState === 'ready') {
        return (
            <div className="p-4 animate-fade-in flex flex-col h-full items-center justify-center text-center">
                <h1 className="text-3xl font-bold text-[#3A5A40]">Color Flow</h1>
                <p className="text-gray-600 my-4">Select a color and tap a shape to fill it. Complete the pattern before time runs out to earn coins.</p>
                <button
                    onClick={startGame}
                    className="bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300"
                >
                    Start
                </button>
                 <button onClick={onBack} className="mt-4 text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-2 rounded-full">
                    Back to Games
                </button>
            </div>
        )
    }

    return (
        <div className="p-4 animate-fade-in flex flex-col h-full">
            <style>{`
                svg path, svg circle {
                    transition: fill 0.5s ease-in-out;
                }
            `}</style>
            <header className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-1 rounded-full flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span>Back</span>
                </button>
                <div className="text-xl font-bold text-[#3A5A40] tabular-nums">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
            </header>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden my-4">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-[300px] aspect-square bg-white rounded-lg shadow-inner p-2">
                    <PatternComponent colors={shapeColors} onShapeClick={handleShapeClick} />
                </div>
            </div>

            <div className="flex justify-center items-center space-x-2 p-4 bg-white/50 rounded-full shadow-md">
                {PALETTE.map(color => (
                    <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-transform duration-200 border-2 ${selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            {gameState === 'over' && <PositiveThoughtModal onClose={() => onGameComplete(coinsEarned)} coinsEarned={coinsEarned} />}
        </div>
    );
};

export default ColorFlow;