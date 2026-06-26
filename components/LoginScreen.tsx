import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [soldierId, setSoldierId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { setPlan } = useSubscription();

    const handleLogin = () => {
        if (soldierId.trim() === '' || password.trim() === '') {
            setError('Please enter both Soldier ID and Password.');
            return;
        }
        // In a real app, you'd have an API call here for authentication.
        // For this demo, any non-empty input is considered valid.
        setError('');
        setPlan('free');
        onLogin();
    };
    
    return (
        <div className="h-screen w-screen bg-[#F8F5F2] dark:bg-gray-900 flex justify-center items-center p-4">
            <div className="w-full max-w-sm p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-[#3A5A40] dark:text-green-300">SentryMind+</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Your confidential mental wellness companion.</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="soldierId" className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Soldier ID</label>
                        <input 
                            id="soldierId" 
                            type="text" 
                            value={soldierId}
                            onChange={(e) => setSoldierId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            className="w-full p-3 mt-1 text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition"
                            placeholder="Enter your ID"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Password</label>
                        <input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            className="w-full p-3 mt-1 text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#588157] focus:border-transparent transition"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-center text-red-500">{error}</p>}
                
                <button
                    onClick={handleLogin}
                    className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                >
                    Login
                </button>
            </div>
        </div>
    );
}

export default LoginScreen;