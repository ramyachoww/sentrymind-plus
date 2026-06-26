import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AITone, ChatMessage, Mood, SleepLog, WorkoutLog } from '../types';

const getSystemPrompt = (tone: AITone, isPremium: boolean): string => {
  if (isPremium) {
      return "Act as Mind Guardian+ for soldiers. Use 14-day context window (if available). Keep tone calm, CBT-based, non-clinical, and mission-friendly. Offer 1 actionable step and one follow-up question. Use user's recent mood scores and sleep hours from provided context.";
  }

  switch (tone) {
    case AITone.CalmFriend:
      return "You are a calm, friendly listener for a soldier dealing with stress. Keep replies short, warm, and reflective. Ask one simple, supportive question. Use empathetic and gentle language.";
    case AITone.ClinicalTherapist:
      return "You are a structured therapist using Cognitive Behavioral Therapy (CBT) principles. Validate the user's feelings, then propose evidence-based exercises or reframing techniques in clear, numbered steps. Maintain a professional but compassionate tone.";
    case AITone.MilitaryCoach:
      return "You are a resilience coach for a soldier. Use motivational, direct, and actionable language. Propose concrete steps, routines, and mental drills to build mental fortitude. Focus on strength, duty, and practical coping mechanisms.";
    default:
      return "You are a helpful and supportive mental wellness assistant.";
  }
};

export const classifyTone = (message: string): AITone => {
  const lowerCaseMessage = message.toLowerCase();
  
  const clinicalWords = ["i can't", "hopeless", "overwhelmed", "anxious", "depressed", "worthless"];
  if (clinicalWords.some(word => lowerCaseMessage.includes(word))) {
    return AITone.ClinicalTherapist;
  }
  
  const coachWords = ["train", "push", "mission", "cope", "duty", "strength", "focus"];
  if (coachWords.some(word => lowerCaseMessage.includes(word))) {
    return AITone.MilitaryCoach;
  }
  
  return AITone.CalmFriend;
};

export const getGeminiResponse = async (history: ChatMessage[], newMessage: string, isPremium: boolean): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set.");
    return "I'm sorry, my connection is not configured correctly right now. Please try again later.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const tone = classifyTone(newMessage);
    const systemInstruction = getSystemPrompt(tone, isPremium);

    const contents = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.message }]
    }));
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    const model = isPremium ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.9,
        topK: 40
    };

    if (isPremium) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: contents,
        config
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return "I'm having trouble connecting right now. Let's try a simple breathing exercise instead. Inhale for 4 seconds, hold for 4, and exhale for 6.";
  }
};

export const getReflectionSummary = async (moodText: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set.");
    return "Could not generate reflection due to a configuration issue.";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = "Summarize the user's last mood entry in 2 sentences and suggest a short action they can take. Tone: warm, non-judgmental.";
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: moodText }] }],
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching reflection summary:", error);
    return "Could not generate reflection at this time.";
  }
};

export const getFollowUpSuggestions = async (history: ChatMessage[]): Promise<string[]> => {
  if (!process.env.API_KEY || history.length === 0) {
    return [];
  }
  // Use the last 4 messages for context
  const conversationContext = history.slice(-4).map(msg => `${msg.role}: ${msg.message}`).join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `Based on the last AI response in this conversation, generate 3 short, relevant follow-up questions a user might ask. The questions should be empathetic and encourage further reflection. Return them as a JSON array of strings in a key named 'suggestions'. Example format: {"suggestions": ["Tell me more about that.", "What is one small step I can take?"]}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "An array of 3 follow-up questions."
        }
      },
      required: ['suggestions']
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Conversation context:\n${conversationContext}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8,
      }
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions.slice(0, 3);
    }
    return [];
  } catch (error) {
    console.error("Error fetching follow-up suggestions:", error);
    return [];
  }
};

export const getWellnessInsights = async (moods: Mood[], sleep: SleepLog[], workouts: WorkoutLog[]): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set.");
    return "Could not generate insights due to a configuration issue.";
  }
  if (moods.length === 0 && sleep.length === 0 && workouts.length === 0) {
      return "Log some moods, sleep, or workouts to get your first insight report.";
  }

  // Use recent data for more relevant insights
  const recentMoods = moods.slice(0, 10);
  const recentSleep = sleep.slice(0, 10);
  const recentWorkouts = workouts.slice(0, 10);

  const prompt = `
    Analyze the following wellness data for a soldier and provide 2-3 actionable insights.
    Focus on potential connections between mood, sleep, and physical activity.
    Keep the tone supportive, concise, and non-clinical. Frame insights as observations and gentle suggestions.

    Recent Moods (1=Awful, 5=Great):
    ${recentMoods.map(m => `- ${new Date(m.date).toLocaleDateString()}: Mood ${m.mood}/5. Notes: ${m.notes}`).join('\n') || 'No mood data.'}

    Recent Sleep Logs:
    ${recentSleep.map(s => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '- Invalid sleep data';
        let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (duration < 0) duration += 24;
        return `- ${start.toLocaleDateString()}: ${duration.toFixed(1)} hours.`;
    }).join('\n') || 'No sleep data.'}
    
    Recent Workouts:
    ${recentWorkouts.map(w => `- ${new Date(w.date).toLocaleDateString()}: ${w.type} for ${w.duration} mins.`).join('\n') || 'No workout data.'}

    Provide insights in a friendly, bulleted list format using markdown.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching wellness insights:", error);
    return "Could not generate insights at this time.";
  }
};


export const getMissionFollowUp = async (missionTitle: string, history: { prompt: string; choice: string }[]): Promise<{ responseText: string; choices: string[] }> => {
  if (!process.env.API_KEY) {
    return { responseText: "Connection not configured.", choices: ["Exit"] };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are a resilience coach running a training simulation for a soldier. The mission is called "${missionTitle}".
The user is presented with scenarios and makes choices. The simulation will last for exactly 5 questions.
Your task is to provide a brief, narrative continuation of the scenario based on their last choice and then present 2-3 new, distinct choices.
Do not offer an option to finish the mission. Keep your response text to 1-2 sentences.

Here is the transcript of the simulation so far:
${history.map(turn => `Scenario: "${turn.prompt}"\nUser chose: "${turn.choice}"`).join('\n\n')}

Based on the last choice, continue the simulation.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        responseText: {
          type: Type.STRING,
          description: "A short, 1-2 sentence continuation of the scenario."
        },
        choices: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "An array of 2-3 new choices for the user."
        }
      },
      required: ['responseText', 'choices']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: "Continue the simulation." }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8
      }
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error fetching mission follow-up:", error);
    return { responseText: "There was an issue generating the next step. Please try again.", choices: ["Finish Mission"] };
  }
};

export const getMissionAnalysis = async (missionTitle: string, transcript: { prompt: string; choice: string }[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Could not generate analysis due to a configuration issue.";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are a resilience coach providing a performance review for a soldier who just completed a training simulation called "${missionTitle}".
Analyze the provided transcript of their choices. Provide a concise, constructive analysis report in markdown format.

The report MUST have the following sections:
1.  **Thinking Patterns**: Briefly describe the user's approach and decision-making style based on their choices (e.g., proactive, cautious, direct, collaborative).
2.  **Strengths Demonstrated**: Identify and praise positive skills shown in the transcript (e.g., information gathering, setting boundaries, emotional regulation, proactive communication). Be specific and link it to their choices.
3.  **Areas for Improvement**: Gently suggest alternative perspectives or actions for situations where there was room for a more optimal outcome. Frame this as coaching for future scenarios.
4.  **Path to Improvement**: Offer one clear, actionable tip the user can apply in real life based on the analysis.

The tone should be supportive, encouraging, and mission-focused. Do not use markdown code blocks.

Transcript:
${transcript.map(turn => `Scenario: "${turn.prompt}"\nUser chose: "${turn.choice}"`).join('\n\n')}
`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: "Generate the analysis report." }] }],
       config: {
        systemInstruction,
        temperature: 0.6
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching mission analysis:", error);
    return "Could not generate analysis at this time.";
  }
};
