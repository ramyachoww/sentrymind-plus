import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { UserPlan } from '../types';

interface SubscriptionContextType {
    plan: UserPlan;
    setPlan: (plan: UserPlan) => void;
    isPremium: boolean;
    startTrial: () => void;
    isTrialActive: boolean;
    trialDaysRemaining: number | null;
    hasUsedTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [plan, setPlan] = useLocalStorage<UserPlan>('userPlan', 'free');
    const [trialStartDate, setTrialStartDate] = useLocalStorage<string | null>('trialStartDate', null);

    const getTrialStatus = (): { isActive: boolean; daysRemaining: number | null } => {
        if (!trialStartDate) return { isActive: false, daysRemaining: null };

        const startDate = new Date(trialStartDate);
        const now = new Date();
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        const elapsedMillis = now.getTime() - startDate.getTime();

        if (elapsedMillis >= sevenDaysInMillis) {
            return { isActive: false, daysRemaining: 0 };
        }

        const remainingMillis = sevenDaysInMillis - elapsedMillis;
        const daysRemaining = Math.ceil(remainingMillis / (1000 * 60 * 60 * 24));
        return { isActive: true, daysRemaining };
    };
    
    const { isActive: isTrialActive, daysRemaining: trialDaysRemaining } = getTrialStatus();

    const isPremium = plan === 'premium' || isTrialActive;
    const hasUsedTrial = trialStartDate !== null;

    const startTrial = () => {
        if (!hasUsedTrial) {
            setTrialStartDate(new Date().toISOString());
        }
    };

    return (
        <SubscriptionContext.Provider value={{ plan, setPlan, isPremium, startTrial, isTrialActive, trialDaysRemaining, hasUsedTrial }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = (): SubscriptionContextType => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};