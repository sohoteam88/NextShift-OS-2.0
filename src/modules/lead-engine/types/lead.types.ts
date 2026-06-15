export type LeadTemperature = 'cold' | 'warm' | 'hot';
export type LeadPipelineStage = 'visitor' | 'lead' | 'qualified' | 'appointment' | 'customer';

export interface LeadScore {
  score: number;
  temperature: LeadTemperature;
  factors: { label: string; points: number }[];
}

export interface LeadPipelineStats {
  visitors: number;
  leads: number;
  qualified: number;
  appointments: number;
  customers: number;
  conversionRate: number;
}

export type LeadMagnetType = 'pdf_guide' | 'checklist' | 'quiz' | 'mini_course' | 'assessment' | 'template';
