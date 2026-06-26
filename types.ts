export type Page = 'home' | 'mood' | 'chat' | 'exercises' | 'tracker' | 'games' | 'journal' | 'treasure' | 'feedback' | 'plans' | 'missions';

export interface JournalAnswer {
  question: string;
  answerEmoji: string;
  answerText: string;
}

export interface Mood {
  id: number;
  mood: number; // 1 (worst) to 5 (best)
  emotions?: string[];
  journalAnswers?: JournalAnswer[];
  notes: string;
  date: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
  timestamp: number;
}

export enum AITone {
  CalmFriend = 'calm_friend',
  ClinicalTherapist = 'clinical_therapist',
  MilitaryCoach = 'military_coach',
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface JournalEntry {
  id: number;
  prompt: string;
  text: string;
  date: string;
  reminder?: string;
}

export interface SleepLog {
  id: number;
  startTime: string;
  endTime: string;
  date: string;
  notes?: string;
}

export interface WorkoutLog {
  id: number;
  type: string;
  duration: number; // in minutes
  notes?: string;
  date: string;
}

export interface Reward {
  id: number;
  coins: number;
  reason: string;
  timestamp: string;
}

export type Rank = 'Calm Cadet' | 'Mindful Warrior' | 'Resilient Guardian' | 'Peace Commander';

export interface Notification {
  id: number;
  message: string;
  type: 'coin' | 'rankup';
}

export interface FeedbackEntry {
  id: number;
  rating: number; // 1-5
  category: 'App Feature' | 'AI Therapist' | 'Exercises' | 'General';
  comment: string;
  date: string; // ISO string
}

// --- Premium Features ---
export type UserPlan = 'free' | 'premium';

export interface MissionStep {
    id: number;
    type: 'text' | 'choice';
    content: string;
    choices?: { text: string; nextStep: number | 'complete' }[];
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    duration: number; // in minutes
    reward: number;
    steps: MissionStep[];
}

export interface MissionProgress {
    missionId: string;
    currentStep: number; // The ID of the current step
    status: 'locked' | 'in_progress' | 'completed';
}