// AI Coach V2 — Mission-aware coaching engine
// Replaces role-based personas with mission-context-aware advice

import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';

interface CoachContext {
  missionTitle: string;
  missionObjective: string;
  level: UserLevel;
  progressPct: number;
  nextTask: string;
  completedTasks: string[];
}

interface CoachAdvice {
  why: string;
  outcome: string;
  mistake: string;
  nextBestAction: string;
  encouragement: string;
}

const ADVICE: Record<string, CoachAdvice> = {
  brand_foundation: {
    why: 'Before AI can create content for you, it must understand your story, your audience, and your unique positioning.',
    outcome: 'You will have a complete personal brand foundation: clear positioning, defined audience, and AI that writes in your voice.',
    mistake: 'Common mistake: skipping Brand DNA and jumping straight to content creation. This produces generic content that does not sound like you.',
    nextBestAction: 'Complete your Brand Interview — it takes only 10 minutes and unlocks everything else.',
    encouragement: 'Most successful personal brands spend time on this step. You are building the foundation for everything that follows.',
  },
  content_creation: {
    why: 'Content is how people discover you. Without content, you are invisible online.',
    outcome: 'Your first published content will start attracting attention and building your audience.',
    mistake: 'Common mistake: waiting for perfection. Your first content does not need to be perfect — it needs to be published.',
    nextBestAction: 'Use the Content Engine to generate your first post. AI will create it based on your Brand DNA.',
    encouragement: 'Every successful creator started with one post. You are one click away from joining them.',
  },
  lead_generation: {
    why: 'Content creates attention. Lead magnets convert attention into relationships.',
    outcome: 'You will have a working lead capture system that turns visitors into contacts.',
    mistake: 'Common mistake: creating content without a way to capture leads. Every piece of content should have a next step.',
    nextBestAction: 'Create your first Lead Magnet — a simple free resource that solves one specific problem.',
    encouragement: 'Your first lead is the hardest. After that, you have a system that works.',
  },
  customer_acquisition: {
    why: 'Leads are potential. Customers are proof. Converting your first customer validates everything.',
    outcome: 'Your first customer proves your system works and gives you a real case study.',
    mistake: 'Common mistake: giving up after one follow-up. Most sales happen after 3-5 touch points.',
    nextBestAction: 'Set up your CRM and send your first follow-up message today.',
    encouragement: 'You already have leads. Now it is about consistency in follow-up.',
  },
  system_building: {
    why: 'You have proven you can sell. Now you need systems that work without you being involved in every step.',
    outcome: 'Automated workflows free your time for higher-value activities like strategy and team building.',
    mistake: 'Common mistake: trying to automate everything at once. Start with one workflow, make it work, then add more.',
    nextBestAction: 'Set up your first automated follow-up sequence.',
    encouragement: 'You have built a working business. Systems will take it to the next level.',
  },
  team_scaling: {
    why: 'Your time is finite. Building a team multiplies your impact and creates real business value.',
    outcome: 'A team allows you to serve more customers, create more content, and build a real company.',
    mistake: 'Common mistake: hiring before systems are ready. Build the system, then recruit for the system.',
    nextBestAction: 'Create your first team invitation and identify who you want to bring on board.',
    encouragement: 'You have built something worth duplicating. Now build the team to scale it.',
  },
};

const DEFAULT_ADVICE: CoachAdvice = {
  why: 'Every step in your journey builds on the previous one. Stay consistent.',
  outcome: 'Completing this mission brings you closer to a fully operational business.',
  mistake: 'Common mistake: trying to do everything at once. Focus on one mission at a time.',
  nextBestAction: 'Continue your current mission and complete the next task.',
  encouragement: 'Progress is better than perfection. Keep moving forward.',
};

export function getAICoachAdvice(missionId: string): CoachAdvice {
  return ADVICE[missionId] ?? DEFAULT_ADVICE;
}

export function getNextBestAction(missionId: string, completedTasks: string[]): string {
  const advice = getAICoachAdvice(missionId);
  const remaining = completedTasks.length === 0 ? 'Start your first task.' : `${completedTasks.length} tasks completed. ${advice.nextBestAction}`;
  return remaining;
}
