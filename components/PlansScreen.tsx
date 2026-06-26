import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import useMediaQuery from '../hooks/useMediaQuery';
import { Page } from '../types';

interface PlansScreenProps {
  setPage: (page: Page) => void;
}

const freeFeatures = [
  { text: 'AI Therapist (Basic Mode)', included: true },
  { text: 'Mood Diary & Reflection', included: true },
  { text: 'Calm Games (2 Unlocked)', included: true },
  { text: '1-Minute Breathing Tool', included: true },
  { text: 'Emergency Panic Button', included: true },
  { text: 'Resilience Missions', included: false },
  { text: 'Mood Insights & Analytics', included: false },
  { text: 'Offline Access', included: false },
  { text: 'Customizable Themes', included: false },
];

const premiumFeatures = [
    { text: 'Mind Guardian+ (Advanced AI)', included: true },
    { text: 'Mood Diary & AI Insights', included: true },
    { text: 'All Calm Games Unlocked', included: true },
    { text: '1-Minute Breathing Tool', included: true },
    { text: 'Emergency Panic Button', included: true },
    { text: 'Resilience Missions', included: true },
    { text: 'Mood Insights & Analytics', included: true },
    { text: 'Full Offline Access', included: true },
    { text: 'All Premium Themes', included: true },
];


interface PlanCardProps {
    planName: 'Free' | 'Premium';
    price: string;
    priceDetails: string;
    features: { text: string; included: boolean }[];
    isCurrentPlan: boolean;
    setPage: (page: Page) => void;
    startTrial?: () => void;
    hasUsedTrial?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ planName, price, priceDetails, features, isCurrentPlan, setPage, startTrial, hasUsedTrial }) => {
    const isPremium = planName === 'Premium';

    return (
        <div className={`relative w-full max-w-sm p-6 rounded-2xl shadow-lg border-2 flex flex-col ${isPremium ? 'bg-[#3A5A40] text-white border-[#D4AF37]' : 'bg-white text-gray-800 border-transparent'}`}>
            {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Current Plan
                </div>
            )}
            <h3 className={`text-2xl font-bold text-center ${isPremium ? 'text-white' : 'text-[#3A5A40]'}`}>{planName}</h3>
            <div className="text-center my-4">
                <span className={`text-4xl font-extrabold ${isPremium ? 'text-white' : 'text-gray-900'}`}>{price}</span>
                <span className={`ml-1 text-sm font-medium ${isPremium ? 'text-gray-300' : 'text-gray-500'}`}>{priceDetails}</span>
            </div>

            {isPremium && !isCurrentPlan && !hasUsedTrial && (
                <div className="mb-6 -mt-2">
                    <button
                        onClick={() => {
                            if (startTrial) startTrial();
                            setPage('home');
                        }}
                        className="w-full text-center py-2 px-4 border-2 border-white rounded-full font-semibold text-white hover:bg-white hover:text-[#3A5A40] transition-colors duration-300 text-sm"
                    >
                        Start 7-Day Free Trial
                    </button>
                </div>
            )}

            <ul className="space-y-3 flex-grow mb-6">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold ${feature.included ? (isPremium ? 'bg-green-400 text-white' : 'bg-green-500 text-white') : 'bg-gray-400 text-white'}`}>
                            {feature.included ? '✓' : '✗'}
                        </span>
                        <span className={`${isPremium ? 'text-gray-200' : 'text-gray-600'}`}>{feature.text}</span>
                    </li>
                ))}
            </ul>
            <button
                onClick={() => {
                    if (isPremium && !isCurrentPlan) {
                        alert('Payment integration is out-of-scope for this demo.');
                    } else if (!isPremium && !isCurrentPlan) {
                        setPage('home');
                    }
                }}
                disabled={isCurrentPlan}
                className={`w-full mt-auto font-bold py-3 px-8 rounded-full shadow-md transition-all duration-300 transform
                    ${isPremium
                        ? 'bg-[#D4AF37] text-[#3A5A40] hover:bg-amber-400 hover:-translate-y-1'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }
                    ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isPremium ? (isCurrentPlan ? 'Plan Activated' : 'Upgrade to Premium') : 'Continue with Free'}
            </button>
        </div>
    );
};

const PlansScreen: React.FC<PlansScreenProps> = ({ setPage }) => {
    const { plan, isPremium, isTrialActive, trialDaysRemaining, startTrial, hasUsedTrial } = useSubscription();
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="p-6 space-y-6 bg-[#F8F5F2] min-h-full">
            {isTrialActive && trialDaysRemaining != null && (
                <div className="p-3 mb-2 bg-green-100 text-green-800 font-semibold text-center rounded-lg shadow">
                    You are on a 7-day free trial. {trialDaysRemaining > 0 ? `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} remaining.` : 'Your trial has expired.'}
                </div>
            )}
            <header className="text-center">
                <h1 className="text-3xl font-bold text-[#3A5A40]">Choose Your Plan</h1>
                <p className="text-gray-600 mt-2">Unlock your full potential with SentryMind+ Premium.</p>
            </header>

            <div className={`flex ${isDesktop ? 'flex-row justify-center items-stretch space-x-6' : 'flex-col items-center space-y-8'}`}>
                <PlanCard
                    planName="Free"
                    price="₹0"
                    priceDetails="/ forever"
                    features={freeFeatures}
                    isCurrentPlan={plan === 'free' && !isTrialActive}
                    setPage={setPage}
                />
                <PlanCard
                    planName="Premium"
                    price="₹199"
                    priceDetails="/ month"
                    features={premiumFeatures}
                    isCurrentPlan={isPremium}
                    setPage={setPage}
                    startTrial={startTrial}
                    hasUsedTrial={hasUsedTrial}
                />
            </div>

            <footer className="text-center text-gray-600 pt-4">
                <p className="italic">“Every mind deserves care. Premium unlocks deeper calm for your daily battles.” 💚</p>
            </footer>
        </div>
    );
};

export default PlansScreen;