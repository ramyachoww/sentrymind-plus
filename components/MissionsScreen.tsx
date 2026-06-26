import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { Mission, MissionProgress, Page } from '../types';
import { missions } from '../data/missions';
import UpgradeModal from './UpgradeModal';
import { useRewards } from '../contexts/RewardContext';
import { getMissionFollowUp, getMissionAnalysis } from '../services/geminiService';

const MissionCard: React.FC<{ mission: Mission; progress?: MissionProgress; onStart: () => void }> = ({ mission, progress, onStart }) => {
    const isCompleted = progress?.status === 'completed';
    return (
        <div className={`p-4 rounded-2xl shadow-md flex items-center space-x-4 transition-all duration-300 ${isCompleted ? 'bg-green-100 border-l-4 border-green-500' : 'bg-white'}`}>
            <div className={`w-12 h-12 text-3xl rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-200' : 'bg-gray-100'}`}>
                {isCompleted ? '✅' : '🚩'}
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-lg text-[#3A5A40]">{mission.title}</h3>
                <p className="text-gray-600 text-sm">{mission.description}</p>
                 <div className="text-xs text-gray-500 mt-1 flex items-center space-x-4">
                    <span>🕒 {mission.duration} min</span>
                    <span>🪙 +{mission.reward} coins</span>
                </div>
            </div>
             <button
                onClick={onStart}
                className={`font-bold py-2 px-4 rounded-full shadow-sm text-sm transition ${isCompleted ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-[#588157] text-white hover:bg-[#3A5A40]'}`}
             >
                {isCompleted ? 'Done' : (progress?.status === 'in_progress' ? 'Resume' : 'Start')}
            </button>
        </div>
    );
};

const MissionDetail: React.FC<{ mission: Mission; onComplete: (missionId: string) => void; onExit: () => void }> = ({ mission, onComplete, onExit }) => {
    const initialStep = mission.steps[0];
    
    const [history, setHistory] = useState<{ prompt: string; choice: string }[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState(initialStep.content);
    const [currentChoices, setCurrentChoices] = useState(() => 
        initialStep.choices?.map(c => c.text) || []
    );
    const [questionNumber, setQuestionNumber] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<string | null>(null);

    const handleChoice = async (choice: string) => {
        setIsLoading(true);
        const newHistory = [...history, { prompt: currentPrompt, choice }];
        setHistory(newHistory);
        
        if (questionNumber < 5) {
            setQuestionNumber(prev => prev + 1);
            const response = await getMissionFollowUp(mission.title, newHistory);
            setCurrentPrompt(response.responseText);
            setCurrentChoices(response.choices);
            setIsLoading(false);
        } else {
            const report = await getMissionAnalysis(mission.title, newHistory);
            setAnalysisReport(report);
            onComplete(mission.id);
            setIsLoading(false);
        }
    };

    if (analysisReport) {
        return (
            <div className="p-6 h-full flex flex-col animate-fade-in">
                <header className="mb-4 text-center">
                    <h1 className="text-2xl font-bold text-[#3A5A40]">Mission Complete</h1>
                    <p className="text-gray-600">Well done, soldier. Here is your analysis.</p>
                </header>
                <div className="flex-grow bg-white p-6 rounded-2xl shadow-lg overflow-y-auto">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Report</h2>
                    <div
                        className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: analysisReport.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}
                    />
                </div>
                <button
                    onClick={onExit}
                    className="w-full mt-4 bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all"
                >
                    Return to Missions
                </button>
            </div>
        );
    }
    
    return (
        <div className="p-6 h-full flex flex-col animate-fade-in">
            <header className="mb-6">
                 <button onClick={onExit} className="text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-1 rounded-full flex items-center space-x-1 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span>Missions</span>
                </button>
                <div className="flex justify-between items-baseline">
                    <h1 className="text-2xl font-bold text-[#3A5A40]">{mission.title}</h1>
                    <p className="font-semibold text-gray-500">Question {questionNumber} of 5</p>
                </div>
            </header>
            <div className="flex-grow bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                <p className="text-gray-700 text-lg leading-relaxed mb-8">{currentPrompt}</p>
                <div className="relative flex flex-col">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-20">
                            <svg className="animate-spin h-8 w-8 text-[#3A5A40]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                    {currentChoices.map((choice, index) => {
                        const isFirst = index === 0;
                        const isLast = index === (currentChoices.length ?? 0) - 1;
                        const total = currentChoices.length ?? 0;

                        const classes = [
                            'w-full', 'text-left', 'bg-gray-50', 'text-gray-800',
                            'p-4', 'border', 'border-gray-200', 'transition', 'relative',
                            'hover:bg-white', 'hover:border-gray-800', 'hover:z-10',
                            'focus:outline-none', 'focus:z-10', 'focus:ring-1', 'focus:ring-offset-0', 'focus:ring-gray-800', 'focus:border-gray-800',
                            'disabled:opacity-50'
                        ];

                        if (total === 1) {
                            classes.push('rounded-lg');
                        } else if (isFirst) {
                            classes.push('rounded-t-lg');
                        } else if (isLast) {
                            classes.push('rounded-b-lg');
                        }

                        if (!isFirst) {
                            classes.push('-mt-px');
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleChoice(choice)}
                                disabled={isLoading}
                                className={classes.join(' ')}
                            >
                                {choice}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface MissionsScreenProps {
    setPage: (page: Page) => void;
}

const MissionsScreen: React.FC<MissionsScreenProps> = ({ setPage }) => {
    const { isPremium } = useSubscription();
    const { addReward } = useRewards();
    const [progress, setProgress] = useLocalStorage<MissionProgress[]>('missionsProgress', []);
    const [activeMission, setActiveMission] = useState<Mission | null>(null);

    useEffect(() => {
        if (!isPremium) {
            setActiveMission(null);
        }
    }, [isPremium]);
    
    const getMissionProgress = (missionId: string) => {
        return progress.find(p => p.missionId === missionId);
    };

    const handleMissionComplete = (missionId: string) => {
        const mission = missions.find(m => m.id === missionId);
        if (!mission) return;
        
        const existingProgress = getMissionProgress(mission.id);
        if (existingProgress?.status !== 'completed') {
             addReward(mission.reward, `Mission: ${mission.title}`);
        }
       
        const newProgress: MissionProgress = { missionId: mission.id, currentStep: 1, status: 'completed' };
        setProgress(prev => [...prev.filter(p => p.missionId !== mission.id), newProgress]);
    };

    if (!isPremium) {
        return (
            <div className="relative h-full">
                <UpgradeModal
                    featureName="Resilience Missions"
                    description="Engage in gamified mental-strength challenges to build coping skills and earn exclusive rewards."
                    onClose={() => setPage('home')}
                    setPage={setPage}
                />
            </div>
        );
    }

    if (activeMission) {
        return <MissionDetail mission={activeMission} onComplete={handleMissionComplete} onExit={() => setActiveMission(null)} />;
    }

    return (
        <div className="p-6 space-y-6 bg-[#F8F5F2] min-h-full">
            <header>
                <h1 className="text-3xl font-bold text-[#3A5A40]">Resilience Missions</h1>
                <p className="text-gray-600">Gamified challenges to strengthen your mind.</p>
            </header>
            <div className="space-y-4">
                {missions.map(mission => (
                    <MissionCard
                        key={mission.id}
                        mission={mission}
                        progress={getMissionProgress(mission.id)}
                        onStart={() => setActiveMission(mission)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MissionsScreen;