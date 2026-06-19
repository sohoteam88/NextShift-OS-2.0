export interface JourneyMilestone {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}
