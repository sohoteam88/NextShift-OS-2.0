// Lead Scoring Engine — scores and ranks leads

import type { LeadScore, LeadTemperature } from '../types/lead.types';

interface ScoreInput {
  downloadedMagnet?: boolean;
  quizCompleted?: boolean;
  whatsappClicked?: boolean;
  pageVisits?: number;
  formCompleted?: boolean;
  appointmentRequested?: boolean;
}

const FACTORS: { label: string; points: number; check: (i: ScoreInput) => boolean }[] = [
  { label: 'Lead Magnet Download', points: 20, check: i => !!i.downloadedMagnet },
  { label: 'Quiz Completion', points: 30, check: i => !!i.quizCompleted },
  { label: 'WhatsApp Click', points: 20, check: i => !!i.whatsappClicked },
  { label: 'Page Visits (3+)', points: 15, check: i => (i.pageVisits ?? 0) >= 3 },
  { label: 'Form Completion', points: 25, check: i => !!i.formCompleted },
  { label: 'Appointment Request', points: 50, check: i => !!i.appointmentRequested },
];

export function calculateLeadScore(input: ScoreInput): LeadScore {
  const applied = FACTORS.filter(f => f.check(input));
  const score = applied.reduce((sum, f) => sum + f.points, 0);
  const temperature: LeadTemperature = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return { score, temperature, factors: applied.map(f => ({ label: f.label, points: f.points })) };
}

export function getLeadTemperature(score: number): LeadTemperature {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export function rankLeads(leads: { id: string; score: number }[]): { id: string; score: number }[] {
  return [...leads].sort((a, b) => b.score - a.score);
}
