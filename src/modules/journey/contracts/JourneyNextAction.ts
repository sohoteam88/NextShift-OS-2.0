export interface JourneyNextAction {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  title: string;
  description: string;
  route: string;
  actionType: 'navigation' | 'mission' | 'setup' | 'content' | 'crm';
}
