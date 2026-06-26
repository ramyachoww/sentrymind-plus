import React, { useState, useRef, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ChatMessage, Page } from '../types';
import { getGeminiResponse, getFollowUpSuggestions, getApiKey } from '../services/geminiService';
import { useRewards } from '../contexts/RewardContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeModal from './UpgradeModal';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from "@google/genai";

// --- Helper functions for audio encoding/decoding ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Helper Functions ---


const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${isUser ? 'bg-[#588157] text-white rounded-br-none dark:bg-green-600' : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-100'}`}>
                <p className="text-sm">{message.message}</p>
            </div>
        </div>
    );
};

const CopilotIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const MicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface ChatScreenProps {
    setPage: (page: Page) => void;
}

const defaultSuggestions = [
    'How can I manage my anxiety today?',
    'Tips for better sleep tonight?',
    'Suggest a breathing exercise for me.',
];

const ChatScreen: React.FC<ChatScreenProps> = ({ setPage }) => {
    const [history, setHistory] = useLocalStorage<ChatMessage[]>('chatHistory', []);
    const { addReward } = useRewards();
    const { isPremium } = useSubscription();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Voice Chat State ---
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentUserTranscription, setCurrentUserTranscription] = useState('');
    const [currentAiTranscription, setCurrentAiTranscription] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptionHistoryRef = useRef({ user: '', ai: '' });
    
    const isVoiceChatActive = isRecording || isConnecting;

    useEffect(() => {
        if (!isPremium) {
            setShowUpgradeModal(true);
        }
    }, [isPremium]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (history.length === 0) {
            setSuggestions(defaultSuggestions);
        }
        scrollToBottom();
    }, [history]);
    
    const handleSend = async (messageOverride?: string) => {
        const messageToSend = messageOverride || input;
        if (messageToSend.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            message: messageToSend,
            timestamp: Date.now()
        };
        
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        
        if (!messageOverride) {
            setInput('');
        }
        setIsLoading(true);
        setSuggestions([]);

        if (localStorage.getItem('courageRewardPending') === 'true') {
            addReward(3, 'Courage Reward');
            localStorage.removeItem('courageRewardPending');
        }

        const aiResponseText = await getGeminiResponse(history, messageToSend, isPremium);
        
        const aiMessage: ChatMessage = {
            role: 'ai',
            message: aiResponseText,
            timestamp: Date.now()
        };

        const finalHistory = [...newHistory, aiMessage];
        setHistory(finalHistory);
        setIsLoading(false);

        setIsFetchingSuggestions(true);
        const followUps = await getFollowUpSuggestions(finalHistory);
        setSuggestions(followUps);
        setIsFetchingSuggestions(false);
    };

    // --- Voice Chat Logic ---
    const stopVoiceChat = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }

        microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        
        setIsRecording(false);
        setIsConnecting(false);
        setCurrentUserTranscription('');
        setCurrentAiTranscription('');
        transcriptionHistoryRef.current = { user: '', ai: '' };
    }, []);

    const startVoiceChat = useCallback(async () => {
        setIsConnecting(true);
        setCurrentUserTranscription('Connecting...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.0-flash-exp',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a friendly and helpful mental wellness assistant for soldiers. Keep your responses concise and supportive.'
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsRecording(true);
                        setCurrentUserTranscription('Listening...');

                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            transcriptionHistoryRef.current.user += text;
                            setCurrentUserTranscription(transcriptionHistoryRef.current.user);
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            transcriptionHistoryRef.current.ai += text;
                            setCurrentAiTranscription(transcriptionHistoryRef.current.ai);
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(s => s.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userMsg = transcriptionHistoryRef.current.user.trim();
                            const aiMsg = transcriptionHistoryRef.current.ai.trim();
                            if (userMsg || aiMsg) {
                                const newMessages: ChatMessage[] = [];
                                if (userMsg) newMessages.push({ role: 'user', message: userMsg, timestamp: Date.now() });
                                if (aiMsg) newMessages.push({ role: 'ai', message: aiMsg, timestamp: Date.now() });
                                setHistory(prev => [...prev, ...newMessages]);
                            }
                            transcriptionHistoryRef.current = { user: '', ai: '' };
                            setCurrentUserTranscription('Listening...');
                            setCurrentAiTranscription('');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setCurrentUserTranscription('Connection error. Please try again.');
                        stopVoiceChat();
                    },
                    onclose: () => {
                        stopVoiceChat();
                    }
                }
            });
            sessionPromiseRef.current = sessionPromise;
        } catch (error) {
            console.error('Failed to start voice chat:', error);
            setCurrentUserTranscription('Could not access microphone.');
            setIsConnecting(false);
        }
    }, [stopVoiceChat]);

    const handleToggleVoiceChat = () => {
        if (isRecording || isConnecting) {
            stopVoiceChat();
        } else {
            startVoiceChat();
        }
    };

    useEffect(() => {
        return () => {
            stopVoiceChat();
        }
    }, [stopVoiceChat]);
    // --- End Voice Chat Logic ---


    return (
        <div className="flex flex-col h-full bg-[#F8F5F2] dark:bg-gray-900 relative">
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            {showUpgradeModal && (
                <UpgradeModal
                    featureName="Mind Guardian+"
                    description="Get deeper, private AI support with longer memory and advanced CBT-based guidance to build calm and resilience."
                    onClose={() => setShowUpgradeModal(false)}
                    setPage={setPage}
                />
            )}
            <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-center text-[#3A5A40] dark:text-green-300">
                    AI Therapist {isPremium && <span className="text-amber-500 text-base align-super">+</span>}
                </h1>
                 <div className="flex items-center justify-center mt-1">
                    <img src="https://picsum.photos/id/1005/40/40" alt="Soldier Avatar" className="w-8 h-8 rounded-full mr-2 border-2 border-[#A3B18A]" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your calm companion is listening.</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-none p-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {isVoiceChatActive && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 min-h-[6rem]">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                            <span className="font-bold">You: </span>
                            <span className="italic text-gray-600 dark:text-gray-400">{currentUserTranscription || '...'}</span>
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                            <span className="font-bold">AI: </span>
                            <span className="italic text-gray-600 dark:text-gray-400">{currentAiTranscription}</span>
                        </p>
                    </div>
                )}
                {!isVoiceChatActive && (isFetchingSuggestions || suggestions.length > 0) && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 animate-fade-in">
                        <div className="flex items-center space-x-2 mb-2">
                            <CopilotIcon />
                            <h4 className="text-sm font-bold text-[#3A5A40] dark:text-green-300">Copilot</h4>
                        </div>
                        {isFetchingSuggestions ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">Thinking of what to say next...</div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s)}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 text-sm font-semibold text-[#3A5A40] dark:text-green-200 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isVoiceChatActive ? 'Voice chat is active' : 'Type your message...'}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-[#588157] focus:border-[#588157] transition bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        disabled={isLoading || isVoiceChatActive}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || input.trim() === '' || isVoiceChatActive}
                        className="bg-[#588157] text-white p-3 rounded-full shadow-md hover:bg-[#3A5A40] dark:bg-green-600 dark:hover:bg-green-500 transition disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
                        aria-label="Send Message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                     <button
                        onClick={handleToggleVoiceChat}
                        disabled={isLoading}
                        className={`p-3 rounded-full shadow-md transition text-white ${isConnecting ? 'bg-amber-500 cursor-wait' : ''} ${isRecording ? 'bg-red-500 animate-pulse' : ''} ${!isVoiceChatActive ? 'bg-[#A3B18A] hover:bg-[#CAD2C5]' : ''}`}
                        aria-label={isRecording ? "Stop voice chat" : "Start voice chat"}
                    >
                        {isConnecting ? <SpinnerIcon/> : <MicIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatScreen;