import React, { useMemo } from 'react';

const POSITIVE_THOUGHTS = [
    "Peace is your strength, soldier.",
    "Your resilience is a fortress.",
    "Breathe in calm, breathe out noise.",
    "Today's focus builds tomorrow's strength.",
    "You are grounded and steady.",
    "Each moment of peace is a victory.",
    "Your mind is clear and sharp.",
    "Strength isn't just physical; it's mental calm."
];

interface PositiveThoughtModalProps {
    onClose: () => void;
    coinsEarned: number;
}

const PositiveThoughtModal: React.FC<PositiveThoughtModalProps> = ({ onClose, coinsEarned }) => {
    const thought = useMemo(() => POSITIVE_THOUGHTS[Math.floor(Math.random() * POSITIVE_THOUGHTS.length)], []);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-6 animate-fade-in-up">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m5 4v4m-2-2h4M17 3v4m-2-2h4M3 11h18" /></svg>
                </div>
                
                <div>
                    <h2 className="text-xl font-bold text-[#3A5A40]">Well Done!</h2>
                    <p className="text-gray-600 mt-2 text-lg">"{thought}"</p>
                </div>
                
                <div className="bg-amber-100/80 rounded-full px-4 py-2 inline-flex items-center space-x-2">
                    <span className="font-bold text-lg text-amber-700">+{coinsEarned}</span>
                    <span className="text-amber-600">COINS</span>
                </div>
                
                <button
                    onClick={onClose}
                    className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300"
                >
                    Continue
                </button>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes fade-in-up { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PositiveThoughtModal;
