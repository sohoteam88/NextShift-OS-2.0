export interface JourneyMission {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
}
