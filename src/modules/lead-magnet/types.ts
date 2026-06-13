export type LeadMagnetType = 'assessment' | 'quiz' | 'checklist';
export type LeadSegment = 'A' | 'B' | 'C' | 'D';
export type LMStatus = 'draft' | 'generated' | 'saved' | 'published';

export interface AssessmentQuestion { id: string; question: string; options: { label: string; value: number }[]; }
export interface QuizQuestion { id: string; question: string; options: { label: string; value: number; segment: LeadSegment }[]; }
export interface ChecklistItem { id: string; text: string; completed: boolean; }
export interface ScoreCategory { range: [number, number]; label: string; description: string; segment: LeadSegment; recommendation: string; }

export interface ResultPage {
  scoreLabel: string;
  categoryLabel: string;
  explanation: string;
  recommendations: string[];
  nextAction: string;
  cta: CTABlock;
}

export interface CTABlock {
  headline: string;
  buttonText: string;
  description: string;
  whatsappCta: string;
  funnelCta: string;
}

export interface LeadMagnetConfig {
  id: string;
  type: LeadMagnetType;
  title: string;
  promise: string;
  description: string;
  audiencePain: string;
  questions?: AssessmentQuestion[] | QuizQuestion[];
  checklistItems?: ChecklistItem[];
  scoreCategories?: ScoreCategory[];
  resultPage: ResultPage;
  cta: CTABlock;
  segmentation: { leadScore: LeadSegment; nextAction: string; followUpStrategy: string };
  qualityScore: number;
  status: LMStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeadMagnetQuality {
  score: number; audienceRelevance: number; painClarity: number; promiseClarity: number;
  ctaStrength: number; conversionReadiness: number; brandAlignment: number;
  missingItems: string[]; recommendations: string[];
}

export const EMPTY_CTA: CTABlock = { headline: '', buttonText: '', description: '', whatsappCta: '', funnelCta: '' };
