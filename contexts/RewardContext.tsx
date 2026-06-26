import React, { createContext, useState, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Reward, Rank, Notification } from '../types';

interface RewardContextType {
    totalCoins: number;
    rank: Rank;
    rewards: Reward[];
    notifications: Notification[];
    addReward: (coins: number, reason: string) => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

const RANKS: { name: Rank; threshold: number }[] = [
    { name: 'Peace Commander', threshold: 300 },
    { name: 'Resilient Guardian', threshold: 150 },
    { name: 'Mindful Warrior', threshold: 50 },
    { name: 'Calm Cadet', threshold: 0 },
];

const getRank = (coins: number): Rank => {
    return RANKS.find(r => coins >= r.threshold)?.name || 'Calm Cadet';
};

export const RewardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rewards, setRewards] = useLocalStorage<Reward[]>('rewards', []);
    const [totalCoins, setTotalCoins] = useLocalStorage<number>('userCoins', 0);
    const [rank, setRank] = useLocalStorage<Rank>('userRank', 'Calm Cadet');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string, type: 'coin' | 'rankup') => {
        const newNotif = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotif]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
        }, 3500);
    };

    const addReward = (coins: number, reason: string) => {
        if (coins <= 0) return;

        const newReward: Reward = {
            id: Date.now(),
            coins,
            reason,
            timestamp: new Date().toISOString(),
        };

        const oldRank = getRank(totalCoins);
        const newTotalCoins = totalCoins + coins;
        const newRank = getRank(newTotalCoins);
        
        setRewards(prev => [newReward, ...prev]);
        setTotalCoins(newTotalCoins);
        
        addNotification(`+${coins} coins added for ${reason}.`, 'coin');

        if (newRank !== oldRank) {
            setRank(newRank);
            addNotification(`Congratulations, you've ranked up to ${newRank}!`, 'rankup');
        }
    };
    
    return (
        <RewardContext.Provider value={{ totalCoins, rank, rewards, notifications, addReward }}>
            {children}
        </RewardContext.Provider>
    );
};

export const useRewards = (): RewardContextType => {
    const context = useContext(RewardContext);
    if (!context) {
        throw new Error('useRewards must be used within a RewardProvider');
    }
    return context;
};