import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { FeedbackEntry } from '../types';
import { useRewards } from '../contexts/RewardContext';

const Star: React.FC<{ filled: boolean; onHover: () => void; onClick: () => void; }> = ({ filled, onHover, onClick }) => (
    <svg onMouseEnter={onHover} onClick={onClick} className={`w-8 h-8 cursor-pointer transition-colors ${filled ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
);

const StarRatingInput: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex justify-center" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    filled={hoverRating >= star || rating >= star}
                    onHover={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                />
            ))}
        </div>
    );
};

const CATEGORIES: FeedbackEntry['category'][] = ['General', 'App Feature', 'AI Therapist', 'Exercises'];

const timeAgo = (isoDate: string): string => {
    const date = new Date(isoDate);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

const FeedbackScreen: React.FC = () => {
    const [feedback, setFeedback] = useLocalStorage<FeedbackEntry[]>('feedbackEntries', []);
    const { addReward } = useRewards();

    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState<FeedbackEntry['category']>('General');
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [filterCategory, setFilterCategory] = useState<FeedbackEntry['category'] | 'All'>('All');

    const handleSubmit = () => {
        if (rating === 0) {
            setError('Please provide a star rating.');
            return;
        }
        if (comment.trim().length < 10) {
            setError('Please provide a comment of at least 10 characters.');
            return;
        }
        setError('');
        const newFeedback: FeedbackEntry = {
            id: Date.now(),
            rating,
            category,
            comment: comment.trim(),
            date: new Date().toISOString(),
        };
        setFeedback(prev => [newFeedback, ...prev]);
        addReward(5, "Sharing Feedback");

        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setRating(0);
            setCategory('General');
            setComment('');
        }, 3000);
    };

    const filteredFeedback = useMemo(() => {
        if (filterCategory === 'All') {
            return feedback;
        }
        return feedback.filter(item => item.category === filterCategory);
    }, [feedback, filterCategory]);
    
    return (
        <div className="p-6 space-y-6 bg-[#F8F5F2] min-h-full">
            <header>
                <h1 className="text-3xl font-bold text-[#3A5A40]">Voices from the Field</h1>
                <p className="text-gray-600">Share your experience and read anonymous feedback.</p>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
                {submitted ? (
                    <div className="text-center space-y-3 py-8 transition-opacity duration-500">
                        <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Thank You!</h2>
                        <p className="text-gray-600">Your feedback helps us improve SentryMind+ for everyone.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-semibold text-gray-800 text-center">Share Your Feedback</h2>
                        <StarRatingInput rating={rating} setRating={setRating} />
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as FeedbackEntry['category'])}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-[#588157] transition"
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                            <textarea
                                id="comment"
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#588157]"
                                placeholder="Tell us about your experience..."
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-[#588157] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#3A5A40] transition"
                        >
                            Submit Anonymously
                        </button>
                    </>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Community Feedback</h2>
                <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
                    <button onClick={() => setFilterCategory('All')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${filterCategory === 'All' ? 'bg-[#3A5A40] text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
                    {CATEGORIES.map(cat => (
                         <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition whitespace-nowrap ${filterCategory === cat ? 'bg-[#3A5A40] text-white' : 'bg-gray-100 text-gray-700'}`}>{cat}</button>
                    ))}
                </div>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                    {filteredFeedback.length > 0 ? (
                        filteredFeedback.map(item => (
                            <div key={item.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#A3B18A]">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 ${i < item.rating ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                            ))}
                                        </div>
                                        <p className="text-xs font-semibold text-gray-500 mt-1">{item.category}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">{timeAgo(item.date)}</p>
                                </div>
                                <p className="text-gray-700 mt-2 text-sm">{item.comment}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">No feedback found for this category yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackScreen;
