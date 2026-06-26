import React, { useState, useEffect, useRef, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useRewards } from '../contexts/RewardContext';

// --- TYPES & CONSTANTS ---

interface BreathingPattern {
  name: string;
  description: string;
  phases: {
    in: number;
    hold1: number;
    out: number;
    hold2?: number;
  };
}

const breathingTechniques: BreathingPattern[] = [
  {
    name: 'Box Breathing',
    description: 'Balance and focus (4-4-4-4)',
    phases: { in: 4, hold1: 4, out: 4, hold2: 4 },
  },
  {
    name: 'Relaxing Breath',
    description: 'Calm the nervous system (4-7-8)',
    phases: { in: 4, hold1: 7, out: 8 },
  },
  {
    name: 'Coherent Breathing',
    description: 'Reduce stress (5-5)',
    phases: { in: 5, hold1: 0, out: 5 },
  },
];

const durationOptions = [
  { label: '1 Min', value: 60 },
  { label: '2 Min', value: 120 },
  { label: '3 Min', value: 180 },
  { label: '5 Min', value: 300 },
];

// --- BREATHING EXERCISE COMPONENT ---

interface BreathingOrbProps {
  pattern: BreathingPattern['phases'];
  duration: number;
  onClose: (completed: boolean) => void;
}

type Phase = 'in' | 'hold1' | 'out' | 'hold2';

const getNextPhase = (currentPhase: Phase, p: BreathingOrbProps['pattern']): { type: Phase; duration: number } => {
    switch (currentPhase) {
        case 'in': return { type: 'hold1', duration: p.hold1 };
        case 'hold1': return { type: 'out', duration: p.out };
        case 'out': return p.hold2 !== undefined ? { type: 'hold2', duration: p.hold2 } : { type: 'in', duration: p.in };
        case 'hold2': return { type: 'in', duration: p.in };
        default: return { type: 'in', duration: p.in };
    }
};

const BreathingOrb: React.FC<BreathingOrbProps> = ({ pattern, duration, onClose }) => {
    const [phase, setPhase] = useState<Phase>('in');
    const [phaseDuration, setPhaseDuration] = useState(pattern.in);
    const [timeLeft, setTimeLeft] = useState(duration);

    const sessionTimeoutRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    const phaseTimeoutRef = useRef<number | null>(null);
    
    const stopSession = useCallback((sessionEnded: boolean) => {
        if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
        onClose(sessionEnded);
    }, [onClose]);

    useEffect(() => {
        sessionTimeoutRef.current = window.setTimeout(() => stopSession(true), duration * 1000);
        countdownIntervalRef.current = window.setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [duration, stopSession]);

    useEffect(() => {
        const transition = () => {
            let next = getNextPhase(phase, pattern);
            while (next.duration === 0) { // Skip phases with 0 duration
                next = getNextPhase(next.type, pattern);
            }
            setPhase(next.type);
            setPhaseDuration(next.duration);
        };
        
        if (phaseDuration > 0) {
            phaseTimeoutRef.current = window.setTimeout(transition, phaseDuration * 1000);
        } else {
            transition();
        }

        return () => {
            if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
        };
    }, [phase, phaseDuration, pattern]);
    
    const phaseText: Record<Phase, string> = {
        in: 'Breathe In',
        hold1: 'Hold',
        out: 'Breathe Out',
        hold2: 'Hold'
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white p-4 animate-fade-in">
            <button onClick={() => stopSession(false)} className="absolute top-4 right-4 text-3xl opacity-70 hover:opacity-100">&times;</button>
            <div className="text-center space-y-4">
                <p className="text-xl font-semibold capitalize tracking-wider">{phaseText[phase]}</p>
                <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                    <div
                        className="absolute inset-0 bg-white/30 rounded-full"
                        style={{
                            transform: `scale(${phase === 'in' || phase === 'hold2' ? 1 : 0.5})`,
                            transition: `transform ${phaseDuration}s cubic-bezier(0.45, 0, 0.55, 1)`
                        }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold">
                        {phaseDuration}
                    </div>
                </div>
                <p className="text-lg">Total Time: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const ExercisesScreen: React.FC = () => {
    const [activeExercise, setActiveExercise] = useState<BreathingPattern | null>(null);
    const [exerciseDuration, setExerciseDuration] = useState(60); // 1 minute default
    const [showCompletion, setShowCompletion] = useState(false);
    const { addReward } = useRewards();
    const [mindfulnessLogs, setMindfulnessLogs] = useLocalStorage<string[]>('mindfulnessLogs', []);

    const handleStartExercise = (pattern: BreathingPattern) => {
        setActiveExercise(pattern);
    };

    const handleCloseExercise = (completed: boolean) => {
        if (completed) {
            const today = new Date().toISOString().split('T')[0];
            if (!mindfulnessLogs.includes(today)) {
                addReward(3, "Mindfulness Moment");
                setMindfulnessLogs(prev => [...prev, today]);
            }
            setShowCompletion(true);
            setTimeout(() => setShowCompletion(false), 3000);
        }
        setActiveExercise(null);
    };
    
    return (
        <>
            <div className="p-6 space-y-6 bg-[#F8F5F2] dark:bg-gray-900 min-h-full">
                <header>
                    <h1 className="text-3xl font-bold text-[#3A5A40] dark:text-green-300">Mindfulness Exercises</h1>
                    <p className="text-gray-600 dark:text-gray-400">Take a moment to reset and find your center.</p>
                </header>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Breathing Techniques</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Focused breathing can lower stress, improve focus, and regulate your body's response to anxiety.</p>
                    
                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration:</label>
                        <div className="flex flex-wrap gap-2">
                            {durationOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setExerciseDuration(option.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                        exerciseDuration === option.value
                                            ? 'bg-[#3A5A40] text-white dark:bg-green-300 dark:text-gray-900'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        {breathingTechniques.map(tech => (
                            <div key={tech.name} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-[#A3B18A] dark:border-green-400/50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{tech.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{tech.description}</p>
                                </div>
                                <button
                                    onClick={() => handleStartExercise(tech)}
                                    className="bg-[#588157] text-white font-bold py-2 px-4 rounded-full shadow-sm hover:bg-[#3A5A40] dark:hover:bg-green-500 transition"
                                >
                                    Start
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {showCompletion && (
                    <div className="p-4 bg-green-100 dark:bg-green-800/20 text-green-800 dark:text-green-200 font-semibold text-center rounded-lg shadow-md animate-fade-in">
                        Exercise Complete! +3 Coins 🪙
                    </div>
                )}
            </div>

            {activeExercise && (
                <BreathingOrb 
                    pattern={activeExercise.phases}
                    duration={exerciseDuration}
                    onClose={handleCloseExercise}
                />
            )}
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </>
    );
};

export default ExercisesScreen;