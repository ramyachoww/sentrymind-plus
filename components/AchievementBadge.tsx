import React from 'react';

interface AchievementBadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ icon, title, description, unlocked }) => {
  return (
    <div className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${unlocked ? 'bg-green-100 border-l-4 border-green-500' : 'bg-gray-100 border-l-4 border-gray-300 filter grayscale'}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${unlocked ? 'bg-green-500' : 'bg-gray-400'}`}>
        <div className="w-7 h-7 text-white">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default AchievementBadge;
