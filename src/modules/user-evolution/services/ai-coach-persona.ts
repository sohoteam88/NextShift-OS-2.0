// AI Coach Persona — adapts coaching style by user level

import type { UserLevel, AICoachPersona } from '../types/evolution.types';

const PERSONAS: Record<UserLevel, AICoachPersona> = {
  explorer: {
    style: 'teacher',
    focus: ['Brand', 'Story', 'Audience'],
    tone: 'Let\'s first understand who you are. Once your Brand DNA is complete, AI can create content that sounds like you.',
  },
  builder: {
    style: 'content_strategist',
    focus: ['Content', 'Lead Generation'],
    tone: 'Consistency matters more than perfection. Publish three pieces of content before worrying about performance.',
  },
  operator: {
    style: 'sales_coach',
    focus: ['Follow-Up', 'Sales', 'Customers'],
    tone: 'You already have leads. Focus on follow-up consistency. Most sales happen after multiple follow-ups.',
  },
  leader: {
    style: 'business_mentor',
    focus: ['Scaling', 'Automation', 'Leadership'],
    tone: 'Your goal is no longer doing everything. Your goal is building systems that work without you.',
  },
};

export function getAICoachPersona(level: UserLevel): AICoachPersona {
  return PERSONAS[level] ?? PERSONAS.explorer;
}
