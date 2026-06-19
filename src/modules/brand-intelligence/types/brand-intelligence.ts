export interface BrandRecommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  status: 'coming_soon' | 'available';
}

export interface BrandChange {
  id: string;
  title: string;
  detail: string;
  date: string;
}

export interface BrandVersion {
  id: string;
  label: string;
  summary: string;
  createdAt: string;
}

export interface BrandHealthSnapshot {
  overallScore: number;
  isComplete: boolean;
  nextRecommendation: string | null;
  categoryScores: {
    identity: number;
    audience: number;
    messaging: number;
    content: number;
    offer: number;
    visual: number;
  };
  missingFields: string[];
  recommendations: string[];
}

export interface BrandAdvisorRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'identity' | 'audience' | 'messaging' | 'content' | 'offer' | 'visual';
}

export interface BrandAdvisorAction {
  id: string;
  label: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BrandAdvisorSnapshot {
  strengths: string[];
  weaknesses: string[];
  blindSpots: string[];
  recommendations: BrandAdvisorRecommendation[];
  priorityActions: BrandAdvisorAction[];
}

export interface BrandIntelligenceSnapshot {
  overallScore: number;
  health: {
    identity: number;
    audience: number;
    offer: number;
    content: number;
    visual: number;
  };
  recommendations: BrandRecommendation[];
  recentChanges: BrandChange[];
  versions: BrandVersion[];
}
