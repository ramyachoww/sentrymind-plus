import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Mood, Page, JournalAnswer } from '../types';
import { useRewards } from '../contexts/RewardContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getReflectionSummary } from '../services/geminiService';

const moodOptions = [
  { level: 1, emoji: '😭', label: 'Awful' },
  { level: 2, emoji: '😔', label: 'Bad' },
  { level: 3, emoji: '😐', label: 'Neutral' },
  { level: 4, emoji: '😡', label: 'Angry' },
  { level: 5, emoji: '😄', label: 'Great' },
];

const emotionSets = {
  negative: ['Sad', 'Anger', 'Anxious', 'Stressed', 'Overwhelmed', 'Lonely', 'Frustrated', 'Irritable', 'Guilty', 'Fearful', 'Ashamed', 'Disappointed', 'Hurt', 'Jealous', 'Worried', 'Confused', 'Upset', 'Devastated'],
  neutral: ['Calm', 'Tired', 'Thoughtful', 'Bored', 'Indifferent', 'Numb', 'Pensive', 'Focused', 'Curious', 'Surprised', 'Skeptical', 'Reflective', 'Okay'],
  positive: ['Happy', 'Grateful', 'Excited', 'Proud', 'Relaxed', 'Motivated', 'Content', 'Joyful', 'Hopeful', 'Loved', 'Optimistic', 'Confident', 'Playful', 'Creative', 'Energetic', 'Amazed', 'Pleased', 'Silly'],
};

const emotionEmojis: Record<string, string> = {
  // Negative
  'Sad': '😢', 'Anger': '😡', 'Anxious': '😟', 'Stressed': '😫', 'Overwhelmed': '😵',
  'Lonely': '😔', 'Frustrated': '😤', 'Irritable': '😠', 'Guilty': '😥',
  'Fearful': '😨', 'Ashamed': '😳', 'Disappointed': '😞', 'Hurt': '💔',
  'Jealous': '😒', 'Worried': '😰', 'Confused': '😕', 'Upset': '☹️', 'Devastated': '😭',
  // Neutral
  'Calm': '😌', 'Tired': '😴', 'Thoughtful': '🤔', 'Bored': '😑',
  'Indifferent': '🤷', 'Numb': '😶', 'Pensive': '🧐', 'Focused': '🎯',
  'Curious': '🧐', 'Surprised': '😲', 'Skeptical': '🤨', 'Reflective': '🧘', 'Okay': '🙂',
  // Positive
  'Happy': '😊', 'Grateful': '🙏', 'Excited': '🎉', 'Proud': '😎',
  'Relaxed': '😌', 'Motivated': '💪', 'Content': '😌', 'Joyful': '🥳',
  'Hopeful': '🤞', 'Loved': '🥰', 'Optimistic': '😄', 'Confident': '🤩',
  'Playful': '😜', 'Creative': '💡', 'Energetic': '⚡', 'Amazed': '😮', 'Pleased': '☺️', 'Silly': '🙃',
};


const getEmotionsForMood = (moodLevel: number): string[] => {
  if (moodLevel <= 2 || moodLevel === 4) return emotionSets.negative;
  if (moodLevel === 3) return emotionSets.neutral;
  return emotionSets.positive;
};

const motivationalQuotes = [
    "The oak fought the wind and was broken, the willow bent when it must and survived.",
    "Breathe, soldier. Your mission right now is to be present.",
    "Strength isn't about how much you can handle before you break, it's about how much you can handle after you break.",
    "A smooth sea never made a skilled sailor. You are navigating the storm.",
    "Every day is a new chance, soldier. You’ve got this."
];

interface JournalQuestion {
  question: string;
  options: { emoji: string; text: string }[];
}

const journalingQuestions: {
  negative: JournalQuestion[];
  neutral: JournalQuestion[];
  positive: JournalQuestion[];
} = {
  negative: [
    {
      question: "What's the main source of this feeling?",
      options: [
        { emoji: '👥', text: 'People' },
        { emoji: '💻', text: 'Work/Mission' },
        { emoji: '🏠', text: 'Home Life' },
        { emoji: '🤔', text: 'Myself' },
        { emoji: '❓', text: 'Unsure' },
      ],
    },
    {
      question: "How is your body feeling?",
      options: [
        { emoji: '😫', text: 'Tense' },
        { emoji: '📉', text: 'Low Energy' },
        { emoji: '🤕', text: 'Achy' },
        { emoji: '🦋', text: 'Anxious' },
        { emoji: '😶', text: 'Numb' },
      ],
    },
    {
      question: "What does your mind need right now?",
      options: [
        { emoji: '🤫', text: 'Quiet' },
        { emoji: '🗣️', text: 'To talk' },
        { emoji: ' distract', text: 'Distraction' },
        { emoji: '🏃', text: 'Movement' },
        { emoji: '🛌', text: 'Rest' },
      ],
    },
  ],
  neutral: [
    {
      question: "What's your current focus on?",
      options: [
        { emoji: '🎯', text: 'A specific task' },
        { emoji: '📅', text: 'The future' },
        { emoji: '🕰️', text: 'The past' },
        { emoji: '☁️', text: 'Daydreaming' },
        { emoji: '🧘', text: 'The present' },
      ],
    },
    {
      question: "What's your energy level like?",
      options: [
        { emoji: '🔋', text: 'Full' },
        { emoji: '⚡', text: 'Steady' },
        { emoji: '⏳', text: 'Waning' },
        { emoji: '☕', text: 'Caffeinated' },
        { emoji: '❓', text: 'Hard to say' },
      ],
    },
    {
      question: "What's one thing you've noticed today?",
      options: [
        { emoji: '☀️', text: 'The weather' },
        { emoji: '😊', text: "Someone's mood" },
        { emoji: '💡', text: 'A new idea' },
        { emoji: '🎵', text: 'A sound' },
        { emoji: '🤔', text: 'An inner thought' },
      ],
    },
  ],
  positive: [
    {
      question: "What's contributing to this good feeling?",
      options: [
        { emoji: '🏆', text: 'An achievement' },
        { emoji: '🤝', text: 'A connection' },
        { emoji: '☀️', text: 'A simple joy' },
        { emoji: '🙏', text: 'Gratitude' },
        { emoji: '💪', text: 'Feeling strong' },
      ],
    },
    {
      question: "How would you describe your energy?",
      options: [
        { emoji: '🚀', text: 'Energized' },
        { emoji: '🌊', text: 'Flowing' },
        { emoji: '😌', text: 'Calm & Content' },
        { emoji: '🎉', text: 'Excited' },
        { emoji: '💖', text: 'Full of love' },
      ],
    },
    {
      question: "How can you share this positivity?",
      options: [
        { emoji: '😊', text: 'Smile at someone' },
        { emoji: '💬', text: 'Send a kind text' },
        { emoji: '🙌', text: 'Encourage a teammate' },
        { emoji: '📝', text: 'Note it down' },
        { emoji: '🧘', text: 'Savor it' },
      ],
    },
  ],
};

const getQuestionsForMood = (moodLevel: number): JournalQuestion[] => {
    if (moodLevel <= 2 || moodLevel === 4) return journalingQuestions.negative;
    if (moodLevel === 3) return journalingQuestions.neutral;
    return journalingQuestions.positive;
};

const PanicModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center space-y-4 animate-fade-in-up">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Immediate Support</h2>
            <p className="text-gray-600">If you are in a crisis or may be in danger, please use the resources below immediately.</p>
            <a href="tel:988" className="block w-full bg-red-600 text-white font-bold py-3 px-4 rounded-full shadow-md hover:bg-red-700 transition">
                Veterans Crisis Line (988, Press 1)
            </a>
            <a href="tel:911" className="block w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-700 transition">
                Emergency Services (911)
            </a>
            <button onClick={onClose} className="mt-2 text-sm text-gray-500 hover:underline">Close</button>
        </div>
    </div>
);

const CoinSparkle: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
            <div
                key={i}
                className="coin-sparkle"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                    animationDelay: `${Math.random() * 0.5}s`,
                }}
            >🪙</div>
        ))}
    </div>
);

interface MoodScreenProps {
    setPage: (page: Page) => void;
}

const MoodScreen: React.FC<MoodScreenProps> = ({ setPage }) => {
  const [moods, setMoods] = useLocalStorage<Mood[]>('moods', []);
  const [lastCheckIn, setLastCheckIn] = useLocalStorage('lastCheckIn', { date: '', streak: 0 });
  const { addReward } = useRewards();
  const { isPremium } = useSubscription();
  
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [lastSubmission, setLastSubmission] = useState<Mood | null>(null);
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [reflection, setReflection] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);

  // New state for guided journaling
  const [journalStep, setJournalStep] = useState(-1); // -1: mood, 0: emotions, 1+: questions
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleReflect = async () => {
    if (!lastSubmission?.notes) return;
    setIsReflecting(true);
    const summary = await getReflectionSummary(lastSubmission.notes);
    setReflection(summary);
    setIsReflecting(false);
  };

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
    setJournalStep(0); // Go to emotion selection
  };

  const handlePrevStep = () => setJournalStep(prev => prev - 1);

  const handleFinishJournaling = (finalAnswers: string[] = answers) => {
    const questions = getQuestionsForMood(selectedMood);
    
    const journalAnswers: JournalAnswer[] = questions.map((q, i) => {
      const answerEmoji = finalAnswers[i];
      const answer = q.options.find(o => o.emoji === answerEmoji);
      return {
          question: q.question,
          answerEmoji: answer?.emoji || '',
          answerText: answer?.text || 'Not answered.'
      };
    });

    const notes = journalAnswers.map(ja =>
        `${ja.question}\n- ${ja.answerEmoji} (${ja.answerText})`
    ).join('\n\n');

    const newMood: Mood = {
      id: Date.now(),
      mood: selectedMood,
      emotions: selectedEmotions,
      journalAnswers,
      notes,
      date: new Date().toISOString(),
    };
    setMoods([newMood, ...moods]);
    setLastSubmission(newMood);

    // --- Reward & Streak Logic ---
    const today = new Date().toISOString().split('T')[0];
    if (lastCheckIn.date !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = yesterday.toISOString().split('T')[0];

        let newStreak = (lastCheckIn.date === yesterdayISO) ? lastCheckIn.streak + 1 : 1;
        if (newStreak === 3) {
            addReward(10, '3-Day Check-in Streak');
        }
        setLastCheckIn({ date: today, streak: newStreak });
    }

    if (newMood.mood <= 2 || newMood.mood === 4) {
      localStorage.setItem('courageRewardPending', 'true');
      setEarnedCoins(0);
    } else {
      let coins = 0;
      let reason = '';
      if (newMood.mood === 3) {
        coins = 2;
        reason = 'Journaling Consistency';
      } else {
        coins = 5;
        reason = 'Positive Mindset';
      }
      addReward(coins, reason);
      setEarnedCoins(coins);
    }

    // Reset for next entry
    setJournalStep(-1);
    setSelectedMood(3);
    setAnswers([]);
    setSelectedEmotions([]);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[journalStep - 1] = answer;
    setAnswers(newAnswers);

    const questions = getQuestionsForMood(selectedMood);
    const isLastStep = journalStep === questions.length;

    setTimeout(() => {
      if (isLastStep) {
        handleFinishJournaling(newAnswers);
      } else {
        setJournalStep(prev => prev + 1);
      }
    }, 300);
  };

  const handleLogAnother = () => {
    setLastSubmission(null);
    setSelectedMood(3);
    setEarnedCoins(0);
    setReflection(null);
    setJournalStep(-1);
    setAnswers([]);
    setSelectedEmotions([]);
  };

  const getMoodEmoji = (level: number) => {
    return moodOptions.find(m => m.level === level)?.emoji || '😐';
  };
  
  const randomQuote = useMemo(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)], [lastSubmission]);

  const renderFeedback = () => {
    if (!lastSubmission) return null;
    const { mood } = lastSubmission;

    const summaryDetails = (
        <div className="bg-white/60 p-3 rounded-lg text-sm text-left space-y-1 text-gray-800 border border-gray-200">
            <p className="font-bold">Your Check-in:</p>
            <p><strong>Mood:</strong> {moodOptions.find(m => m.level === mood)?.emoji} {moodOptions.find(m => m.level === mood)?.label}</p>
            {lastSubmission.emotions && lastSubmission.emotions.length > 0 && (
                <p><strong>Emotions:</strong> {lastSubmission.emotions.join(', ')}</p>
            )}
            {lastSubmission.journalAnswers && lastSubmission.journalAnswers.some(a => a.answerText !== 'Not answered.') && (
                <div className="pt-2 mt-2 border-t border-gray-300">
                    {lastSubmission.journalAnswers.map((answer, i) => (
                        answer.answerText !== 'Not answered.' && (
                            <div key={i} className="mt-2">
                                <p className="font-semibold text-gray-700">{answer.question}</p>
                                <p className="text-gray-600 pl-1">- {answer.answerEmoji} ({answer.answerText})</p>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );

    if (mood <= 2 || mood === 4) {
        return (
            <div className="bg-beige-100 p-6 rounded-2xl shadow-lg space-y-4 text-center border-l-4 border-amber-400">
                <h2 className="text-xl font-semibold text-gray-800">It's okay to not be okay.</h2>
                <p className="text-gray-600">It seems like you’re having a tough day. Sometimes, talking it through can help lighten the load.</p>
                {summaryDetails}
                <button
                    onClick={() => setPage('chat')}
                    className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300"
                >
                    Talk to AI Therapist
                </button>
            </div>
        );
    }
    return (
      <div className={`relative bg-beige-100 p-6 rounded-2xl shadow-lg space-y-4 border-l-4 ${mood === 5 ? 'border-green-400' : 'border-[#A3B18A]'} overflow-hidden`}>
          {mood === 5 && <CoinSparkle />}
          <h2 className="text-xl font-semibold text-gray-800 text-center">
              {mood === 5 ? 'Positive Mindset Earns Strength!' : 'Every reflection counts.'}
          </h2>
          {earnedCoins > 0 &&
            <p className="text-gray-700 font-medium text-center">
                You've earned <span className="font-bold text-amber-700">+{earnedCoins} coins</span> for your consistency.
            </p>
          }
          {summaryDetails}
          <p className="text-gray-600 pt-1 italic text-sm text-center">
              {mood === 5 ? '"Keep that smile shining—your strength inspires others."' : `"${randomQuote}"`}
          </p>
          {isPremium && lastSubmission.notes && (
            <div className="pt-2">
              {reflection ? (
                  <div className="bg-white/50 p-3 rounded-lg text-sm text-gray-700 animate-fade-in">
                      <p className="font-semibold text-gray-800">AI Reflection:</p>
                      <p>{reflection}</p>
                  </div>
              ) : (
                <button onClick={handleReflect} disabled={isReflecting} className="w-full bg-white text-[#3A5A40] font-bold py-2 px-6 rounded-full shadow-sm hover:bg-gray-50 transition-all text-sm disabled:opacity-50">
                    {isReflecting ? 'Reflecting...' : 'Get AI Reflection'}
                </button>
              )}
            </div>
          )}
          <button
              onClick={() => setPage('treasure')}
              className="w-full bg-[#A3B18A] text-[#3A5A40] font-bold py-2 px-6 rounded-full shadow-sm hover:bg-[#CAD2C5] transition-all"
          >
              View Treasure Box
          </button>
      </div>
    );
  };

  const renderMoodSelection = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-center text-gray-800">How would you describe your mood?</h2>
        
        <div className="text-center space-y-2">
            <div className="text-7xl transition-transform duration-300 ease-in-out scale-100">
                {getMoodEmoji(selectedMood)}
            </div>
            <p className="font-semibold text-lg text-gray-700">{moodOptions.find(m => m.level === selectedMood)?.label}</p>
        </div>

        <div className="flex justify-between items-center px-2">
          {moodOptions.map(({ level, emoji }) => (
            <button key={level} onClick={() => setSelectedMood(level)} className={`text-3xl p-2 rounded-full transition-all duration-200 ${selectedMood === level ? 'bg-green-200 scale-125' : 'hover:bg-gray-100'}`}>
              {emoji}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => handleMoodSelect(selectedMood)}
          className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300 transform hover:-translate-y-1"
        >
          Next →
        </button>
    </div>
  );

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
        prev.includes(emotion)
            ? prev.filter(e => e !== emotion)
            : [...prev, emotion]
    );
  };

  const renderEmotionSelection = () => {
    const emotions = getEmotionsForMood(selectedMood);
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <button onClick={() => setJournalStep(-1)} className="text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-1 rounded-full flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span>Back</span>
                </button>
                <p className="text-sm font-semibold text-gray-500">Optional</p>
            </div>
            <p className="text-gray-700 text-center text-lg font-medium">Which of these are you feeling?</p>
            <div className="flex flex-wrap justify-center gap-3">
                {emotions.map(emotion => (
                    <button
                        key={emotion}
                        onClick={() => handleEmotionToggle(emotion)}
                        className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 flex items-center space-x-2 ${
                            selectedEmotions.includes(emotion)
                                ? 'bg-[#3A5A40] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span>{emotionEmojis[emotion] || '❔'}</span>
                        <span>{emotion}</span>
                    </button>
                ))}
            </div>
             <button
                onClick={() => {
                    const questions = getQuestionsForMood(selectedMood);
                    if (questions.length > 0) {
                        setJournalStep(1);
                    } else {
                        handleFinishJournaling();
                    }
                }}
                className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300"
            >
                Next →
            </button>
        </div>
    );
};


  const renderJournalingQuestion = () => {
    const questions = getQuestionsForMood(selectedMood);
    if (journalStep < 1 || journalStep > questions.length) return null;

    const question = questions[journalStep - 1];

    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <button onClick={handlePrevStep} className="text-sm font-semibold text-[#3A5A40] hover:bg-gray-100/50 px-3 py-1 rounded-full flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span>Back</span>
            </button>
            <p className="text-sm font-semibold text-gray-500">Step {journalStep} of {questions.length}</p>
        </div>
        
        <p className="text-gray-700 text-center text-lg font-medium">{question.question}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {question.options.map(option => (
            <button
              key={option.emoji}
              onClick={() => handleAnswerSelect(option.emoji)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-left flex items-center space-x-3"
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-semibold text-gray-800">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
      if (lastSubmission) {
          return (
              <div className="animate-fade-in space-y-4">
                  {renderFeedback()}
                  <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4 text-center">
                    <p className="text-gray-600">"{randomQuote}"</p>
                    <button onClick={handleLogAnother} className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all">Log Another Mood</button>
                  </div>
              </div>
          );
      }
      
      switch (journalStep) {
          case -1: return renderMoodSelection();
          case 0: return renderEmotionSelection();
          default: return renderJournalingQuestion();
      }
  };

  return (
    <>
      <div className="p-6 space-y-6 bg-[#F8F5F2] min-h-full">
        <header className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-[#3A5A40]">Mood Check-In</h1>
                <p className="text-gray-600">Take a moment to connect with yourself.</p>
            </div>
            <button onClick={() => setIsPanicModalOpen(true)} className="bg-red-100 text-red-700 font-bold py-2 px-4 rounded-full shadow-sm hover:bg-red-200 transition-transform hover:scale-105 text-sm">
                Panic
            </button>
        </header>

        {renderContent()}

        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.4s ease-out forwards;
            }
            @keyframes coin-sparkle-anim {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
            }
            .coin-sparkle {
                position: absolute;
                animation: coin-sparkle-anim forwards;
            }
        `}</style>
      </div>

      {isPanicModalOpen && <PanicModal onClose={() => setIsPanicModalOpen(false)} />}
    </>
  );
};

export default MoodScreen;