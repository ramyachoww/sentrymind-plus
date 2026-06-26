import { Mission } from '../types';

export const missions: Mission[] = [
  {
    id: 'focus_under_pressure',
    title: 'Focus Under Pressure',
    description: 'A dynamic scenario on managing priorities.',
    duration: 3,
    reward: 10,
    steps: [
      {
        id: 1,
        type: 'text',
        content: "You're on a tight deadline and a teammate asks for urgent, but unrelated, help. Your own work is critical. What's your initial reaction?",
        choices: [
          { text: "Help them immediately.", nextStep: 0 },
          { text: "Politely decline.", nextStep: 0 },
          { text: "Ask for more details first.", nextStep: 0 }
        ]
      }
    ]
  },
  {
    id: 'quick_reframe',
    title: 'Quick Reframe',
    description: 'A CBT micro-task on challenging thoughts.',
    duration: 2,
    reward: 8,
    steps: [
      {
        id: 1,
        type: 'text',
        content: "Consider the thought: 'I made a mistake, so I'm a failure.' This is 'all-or-nothing' thinking. How can we reframe it more accurately?",
        choices: [
          { text: "I made a mistake, but I can learn from it.", nextStep: 0 },
          { text: "Everyone makes mistakes sometimes.", nextStep: 0 },
          { text: "This single event doesn't define my worth.", nextStep: 0 }
        ]
      }
    ]
  },
  {
    id: 'situational_calm',
    title: 'Situational Calm',
    description: 'An interactive story about coping strategies.',
    duration: 4,
    reward: 12,
    steps: [
       {
        id: 1,
        type: 'text',
        content: "You receive unexpected, frustrating news right before an important briefing. You feel your heart rate climb. What do you do first?",
        choices: [
          { text: "Ignore the feeling and push through.", nextStep: 0 },
          { text: "Take 60 seconds for box breathing.", nextStep: 0 },
        ]
      }
    ]
  }
];