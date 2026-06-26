import React, { useState, useEffect, useRef, useCallback } from 'react';
import PositiveThoughtModal from './PositiveThoughtModal';

interface FocusBubblePopProps {
    onGameComplete: (coinsEarned: number) => void;
    onBack: () => void;
}

interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
    dx: number;
    dy: number;
    wobble: number;
}

interface PoppedBubble {
    id: number;
    x: number;
    y: number;
    size: number;
}

const FocusBubblePop: React.FC<FocusBubblePopProps> = ({ onGameComplete, onBack }) => {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [poppedBubbles, setPoppedBubbles] = useState<PoppedBubble[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
    
    const gameAreaRef = useRef<HTMLDivElement>(null);
    // FIX: The useRef hook with a generic type requires an initial value.
    const animationFrameId = useRef<number | undefined>(undefined);
    const bubbleIntervalId = useRef<number | undefined>(undefined);
    const timerId = useRef<number | undefined>(undefined);

    const createBubble = useCallback(() => {
        if (!gameAreaRef.current) return;
        const { width, height } = gameAreaRef.current.getBoundingClientRect();
        const size = Math.random() * 40 + 30; // 30px to 70px
        const newBubble: Bubble = {
            id: Date.now() + Math.random(),
            size,
            x: Math.random() * (width - size),
            y: height,
            dx: (Math.random() - 0.5) * 1.5,
            dy: -(Math.random() * 0.8 + 0.4), // Slower vertical speed
            wobble: Math.random() * 10,
        };
        setBubbles(prev => [...prev, newBubble]);
    }, []);

    const popBubble = (id: number) => {
        const bubbleToPop = bubbles.find(b => b.id === id);
        if (bubbleToPop) {
            const newPop: PoppedBubble = {
                id: bubbleToPop.id,
                x: bubbleToPop.x,
                y: bubbleToPop.y,
                size: bubbleToPop.size,
            };
            setPoppedBubbles(prev => [...prev, newPop]);
            // Remove the effect after the animation finishes
            setTimeout(() => {
                setPoppedBubbles(prev => prev.filter(p => p.id !== id));
            }, 300);
        }

        setBubbles(prev => prev.filter(b => b.id !== id));
        setScore(prev => prev + 1);
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setBubbles([]);
        setGameState('playing');

        bubbleIntervalId.current = window.setInterval(createBubble, 1200);
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

    const endGame = useCallback(() => {
        if (gameState !== 'playing') return;
        clearInterval(bubbleIntervalId.current);
        clearInterval(timerId.current);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        setGameState('over');
    }, [gameState]);

    const gameLoop = useCallback(() => {
        if (!gameAreaRef.current) return;
        const { width, height } = gameAreaRef.current.getBoundingClientRect();

        setBubbles(prevBubbles =>
            prevBubbles.map(b => {
                let newX = b.x + b.dx;
                let newY = b.y + b.dy;
                let newDx = b.dx;
                let newDy = b.dy;

                // Wall collision
                if (newX <= 0 || newX + b.size >= width) newDx = -newDx;
                if (newY <= 0) newDy = -newDy;

                // Remove bubbles that go off the bottom
                if (newY + b.size > height + 100) return null;

                return { ...b, x: newX, y: newY, dx: newDx, dy: newDy, wobble: b.wobble + 0.1 };
            }).filter((b): b is Bubble => b !== null)
        );

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, []);
    
    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameState, gameLoop]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearInterval(bubbleIntervalId.current);
            clearInterval(timerId.current);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);


    if (gameState === 'ready') {
        return (
            <div className="p-4 animate-fade-in flex flex-col h-full items-center justify-center text-center">
                <h1 className="text-3xl font-bold text-[#3A5A40]">Focus Bubble Pop</h1>
                <p className="text-gray-600 my-4">Tap the bubbles to pop them before time runs out. A calm way to refocus your mind.</p>
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
        <div className="animate-fade-in flex flex-col h-full w-full">
             <style>{`
                .bubble {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2));
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    transition: transform 0.1s ease-out;
                    cursor: pointer;
                }
                .bubble:active {
                    transform: scale(0);
                    opacity: 0;
                }
                .bubble-pop-effect {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff);
                    animation: blast 0.3s ease-out forwards;
                    pointer-events: none;
                }
                @keyframes blast {
                    from { transform: scale(0); opacity: 1; }
                    to { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
            <header className="p-4 flex justify-between items-center text-lg font-semibold text-[#3A5A40] bg-white/30 backdrop-blur-sm">
                <div>Score: <span className="font-bold">{score}</span></div>
                <div>Time: <span className="font-bold">{timeLeft}s</span></div>
            </header>
            
            <div ref={gameAreaRef} className="flex-grow w-full relative overflow-hidden">
                {bubbles.map(bubble => (
                    <div
                        key={bubble.id}
                        className="bubble"
                        style={{
                            width: bubble.size,
                            height: bubble.size,
                            left: bubble.x,
                            top: bubble.y,
                            transform: `translateX(${Math.sin(bubble.wobble) * 5}px)`
                        }}
                        onClick={() => popBubble(bubble.id)}
                    />
                ))}
                {poppedBubbles.map(pop => (
                    <div
                        key={pop.id}
                        className="bubble-pop-effect"
                        style={{
                            width: pop.size,
                            height: pop.size,
                            left: pop.x,
                            top: pop.y,
                        }}
                    />
                ))}
            </div>

            {gameState === 'over' && <PositiveThoughtModal onClose={() => onGameComplete(score)} coinsEarned={score} />}
        </div>
    );
};

export default FocusBubblePop;