import React from 'react';
import { useRewards } from '../contexts/RewardContext';

const RewardNotification: React.FC = () => {
    const { notifications } = useRewards();

    const getIcon = (type: 'coin' | 'rankup') => {
        if (type === 'rankup') {
            return '⭐';
        }
        return '🪙';
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-xs z-[100] pointer-events-none">
             <style>{`
                @keyframes slide-in-down {
                    0% { opacity: 0; transform: translateY(-100%); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-50%); }
                }
                .animate-slide-in-down {
                    animation: slide-in-down 3.5s ease-in-out forwards;
                }
            `}</style>
            <div className="space-y-2">
                {notifications.map(notif => (
                    <div
                        key={notif.id}
                        className="flex items-center space-x-3 p-3 rounded-full shadow-lg animate-slide-in-down"
                        style={{
                            backgroundColor: notif.type === 'rankup' ? '#3A5A40' : '#F5F3E7',
                            color: notif.type === 'rankup' ? '#F5F3E7' : '#4A6C4F',
                        }}
                    >
                        <span className="text-xl">{getIcon(notif.type)}</span>
                        <p className="text-sm font-semibold">{notif.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RewardNotification;