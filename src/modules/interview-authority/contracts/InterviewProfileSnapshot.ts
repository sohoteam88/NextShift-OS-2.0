export interface InterviewProfileSnapshot {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  profileId: string;
  fullName: string;
  professionalRole: string;
  industry: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primarySkills: string[];
  personalStory: string;
  missionStatement: string;

  createdAt: string;
  updatedAt: string;
}
