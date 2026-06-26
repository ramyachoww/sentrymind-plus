import React, { useState, useEffect } from 'react';

interface ConnectWatchModalProps {
  onClose: () => void;
  onConnect: (deviceName: string, syncGoal: boolean) => void;
  customStepGoal: number;
}

const mockDevices = ['Apple Watch Ultra', 'Garmin Fenix 7', 'Samsung Galaxy Watch 6', 'Whoop 4.0', 'Oura Ring Gen3'];

const Spinner: React.FC = () => (
    <svg className="animate-spin h-10 w-10 text-[#3A5A40]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ConnectWatchModal: React.FC<ConnectWatchModalProps> = ({ onClose, onConnect, customStepGoal }) => {
  const [step, setStep] = useState<'scanning' | 'select' | 'syncGoal' | 'connecting'>('scanning');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'scanning') {
      const timer = setTimeout(() => {
        setStep('select');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleSelectDevice = (deviceName: string) => {
    setSelectedDevice(deviceName);
    setStep('syncGoal');
  };
  
  const handleSyncDecision = (sync: boolean) => {
    if (!selectedDevice) return;
    setStep('connecting');
    const timer = setTimeout(() => {
        onConnect(selectedDevice, sync);
    }, 2000);
    // No cleanup needed as the modal will close.
  };

  const renderContent = () => {
    switch (step) {
      case 'scanning':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
            <Spinner />
            <p className="text-lg font-semibold text-gray-700">Scanning for devices...</p>
            <p className="text-sm text-gray-500">Make sure your device is nearby and Bluetooth is enabled.</p>
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-3 px-1">Select a device to connect:</h3>
            {mockDevices.map(device => (
              <button
                key={device}
                onClick={() => handleSelectDevice(device)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-green-100 rounded-lg transition text-black"
              >
                {device}
              </button>
            ))}
          </div>
        );
      case 'syncGoal':
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center min-h-[16rem]">
                <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Sync Daily Goal?</h3>
                <p className="text-sm text-gray-500">
                    Sync your daily step goal of <span className="font-bold">{customStepGoal.toLocaleString()}</span> steps to {selectedDevice}?
                </p>
                <div className="flex w-full space-x-2 pt-4">
                    <button onClick={() => handleSyncDecision(false)} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-300 transition text-sm">Don't Sync</button>
                    <button onClick={() => handleSyncDecision(true)} className="w-full bg-[#3A5A40] text-white font-bold py-3 px-4 rounded-full shadow-md hover:bg-[#588157] transition text-sm">Sync Goal</button>
                </div>
            </div>
        );
      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
            <Spinner />
            <p className="text-lg font-semibold text-gray-700">Connecting to {selectedDevice}...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-4 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Connect Smartwatch</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#588157]">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>{renderContent()}</div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConnectWatchModal;
