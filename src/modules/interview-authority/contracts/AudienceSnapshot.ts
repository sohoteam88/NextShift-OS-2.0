export interface AudienceSnapshot {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  audienceId: string;
  primaryAudience: string;
  audienceProblems: string[];
  audienceGoals: string[];
  audienceObjections: string[];
  audienceChannels: string[];
  audienceLanguage: string;

  createdAt: string;
  updatedAt: string;
}
