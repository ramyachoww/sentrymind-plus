import React, { useState, useEffect, useRef, useCallback } from 'react';
import PositiveThoughtModal from './PositiveThoughtModal';

interface GratitudeCatcherProps {
    onGameComplete: (coinsEarned: number) => void;
    onBack: () => void;
}

interface Note {
    id: number;
    x: number;
    y: number;
    text: string;
    affirmation: string;
    speed: number;
}

interface ScorePopup {
    id: number;
    x: number;
    y: number;
}

const GRATITUDE_NOTES = [
    { prompt: "A happy memory", affirmation: "Cherish the beautiful moments you've created." },
    { prompt: "A person you love", affirmation: "Love is a powerful, healing force in your life." },
    { prompt: "A skill you have", affirmation: "You are capable and talented in your own unique way." },
    { prompt: "Something beautiful you saw", affirmation: "Beauty surrounds you when you choose to see it." },
    { prompt: "A simple pleasure", affirmation: "Find joy in the small, everyday wonders." },
    { prompt: "A strength you possess", affirmation: "Your inner strength is greater than you know." },
    { prompt: "A goal you achieved", affirmation: "Your hard work and dedication pay off." }
];

const CATCHER_WIDTH = 100;
const CATCHER_HEIGHT = 20;
const NOTE_WIDTH = 120;
const NOTE_HEIGHT = 40;

const GratitudeCatcher: React.FC<GratitudeCatcherProps> = ({ onGameComplete, onBack }) => {
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
    const [notes, setNotes] = useState<Note[]>([]);
    const [catcherX, setCatcherX] = useState(150);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [lastAffirmation, setLastAffirmation] = useState<string | null>(null);
    const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | undefined>(undefined);
    const noteIntervalId = useRef<number | undefined>(undefined);
    const timerId = useRef<number | undefined>(undefined);

    const createNote = useCallback(() => {
        if (!gameAreaRef.current) return;
        const { width } = gameAreaRef.current.getBoundingClientRect();
        const noteData = GRATITUDE_NOTES[Math.floor(Math.random() * GRATITUDE_NOTES.length)];
        const newNote: Note = {
            id: Date.now() + Math.random(),
            x: Math.random() * (width - NOTE_WIDTH),
            y: -NOTE_HEIGHT,
            text: noteData.prompt,
            affirmation: noteData.affirmation,
            speed: Math.random() * 1 + 0.5, // Slower speed
        };
        setNotes(prev => [...prev, newNote]);
    }, []);

    const endGame = useCallback(() => {
        if (gameState !== 'playing') return;
        clearInterval(noteIntervalId.current);
        clearInterval(timerId.current);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        setGameState('over');
    }, [gameState]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setNotes([]);
        setLastAffirmation(null);
        setScorePopups([]);
        setGameState('playing');

        noteIntervalId.current = window.setInterval(createNote, 2000);
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

    const gameLoop = useCallback(() => {
        if (!gameAreaRef.current) return;
        const { height } = gameAreaRef.current.getBoundingClientRect();
        const catcherTop = height - CATCHER_HEIGHT;

        setNotes(prevNotes => {
            let caughtNote: Note | null = null;

            const updatedNotes = prevNotes.map(note => {
                const newY = note.y + note.speed;
                if (!caughtNote &&
                    newY + NOTE_HEIGHT >= catcherTop &&
                    note.y < catcherTop &&
                    note.x + NOTE_WIDTH > catcherX &&
                    note.x < catcherX + CATCHER_WIDTH
                ) {
                    caughtNote = note;
                    return null;
                }
                if (newY > height) return null;
                return { ...note, y: newY };
            }).filter((n): n is Note => n !== null);

            if (caughtNote) {
                setScore(prev => prev + 1);
                setLastAffirmation(caughtNote!.affirmation);
                const newPopup: ScorePopup = {
                    id: Date.now(),
                    x: caughtNote.x + NOTE_WIDTH / 2,
                    y: catcherTop,
                };
                setScorePopups(prev => [...prev, newPopup]);
                setTimeout(() => {
                    setScorePopups(prev => prev.filter(p => p.id !== newPopup.id));
                }, 1000);
            }
            return updatedNotes;
        });

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [catcherX]);

    const handleMove = (clientX: number) => {
        if (!gameAreaRef.current || gameState !== 'playing') return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const newX = clientX - rect.left - CATCHER_WIDTH / 2;
        const clampedX = Math.max(0, Math.min(newX, rect.width - CATCHER_WIDTH));
        setCatcherX(clampedX);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => handleMove(e.clientX);
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => handleMove(e.touches[0].clientX);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [gameState, gameLoop]);
    
    useEffect(() => {
        return () => {
            clearInterval(noteIntervalId.current);
            clearInterval(timerId.current);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    if (gameState === 'ready') {
        return (
            <div className="p-4 animate-fade-in flex flex-col h-full items-center justify-center text-center">
                <h1 className="text-3xl font-bold text-[#3A5A40]">Gratitude Catcher</h1>
                <p className="text-gray-600 my-4">Catch the falling notes to reveal positive affirmations. Focus on the good.</p>
                <button onClick={startGame} className="bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300">Start</button>
                <button onClick={onBack} className="mt-4 text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-2 rounded-full">Back to Games</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex flex-col h-full w-full">
             <style>{`
                .score-popup {
                    position: absolute;
                    color: #3A5A40;
                    font-weight: bold;
                    font-size: 1.5rem;
                    animation: score-anim 1s ease-out forwards;
                    pointer-events: none;
                    transform: translateX(-50%);
                }
                @keyframes score-anim {
                    from { transform: translate(-50%, 0); opacity: 1; }
                    to { transform: translate(-50%, -50px); opacity: 0; }
                }
            `}</style>
            <header className="p-4 flex justify-between items-center text-lg font-semibold text-[#3A5A40] bg-white/30 backdrop-blur-sm z-10">
                <div>Score: <span className="font-bold">{score}</span></div>
                <div>Time: <span className="font-bold">{timeLeft}s</span></div>
            </header>
            
            <div
                ref={gameAreaRef}
                className="flex-grow w-full relative overflow-hidden cursor-none"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                {notes.map(note => (
                    <div
                        key={note.id}
                        className="absolute bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 shadow text-center text-gray-800 flex items-center justify-center"
                        style={{
                            width: NOTE_WIDTH,
                            height: NOTE_HEIGHT,
                            left: note.x,
                            top: note.y,
                            fontSize: '12px'
                        }}
                    >
                        {note.text}
                    </div>
                ))}
                <div
                    className="absolute bg-[#A3B18A] rounded-t-lg shadow-inner"
                    style={{
                        width: CATCHER_WIDTH,
                        height: CATCHER_HEIGHT,
                        left: catcherX,
                        bottom: 0
                    }}
                />
                {scorePopups.map(popup => (
                    <div
                        key={popup.id}
                        className="score-popup"
                        style={{
                            left: popup.x,
                            top: popup.y,
                        }}
                    >
                        +1
                    </div>
                ))}
            </div>
            
            <div className="h-20 p-4 text-center flex items-center justify-center bg-white/30 backdrop-blur-sm">
                <p className="text-black font-medium italic transition-opacity duration-500">
                    {lastAffirmation}
                </p>
            </div>

            {gameState === 'over' && <PositiveThoughtModal onClose={() => onGameComplete(score)} coinsEarned={score} />}
        </div>
    );
};

export default GratitudeCatcher;