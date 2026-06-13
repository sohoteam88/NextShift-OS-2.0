export interface WebinarPackage {
  strategy: WebinarStrategy; topic: WebinarTopic; outline: WebinarOutline;
  loomScript: string; slideOutline: SlideOutline[]; registrationPage: RegistrationPage;
  replayPage: ReplayPage; followupSequence: FollowupMessage[]; qualityScore: number; status: 'draft'|'generated'|'saved';
}
export interface WebinarStrategy { targetAudience: string; desiredOutcome: string; trustBuildingAngle: string; authorityPositioning: string; conversionObjective: string; }
export interface WebinarTopic { title: string; promise: string; subtitle: string; }
export interface WebinarOutline { opening: string; story: string; problem: string; opportunity: string; framework: string; caseStudy: string; offer: string; qa: string; cta: string; recommendedDuration: string; }
export interface SlideOutline { slideNumber: number; title: string; objective: string; keyMessage: string; suggestedVisual: string; }
export interface RegistrationPage { headline: string; subheadline: string; bulletPoints: string[]; benefits: string[]; cta: string; urgency: string; faq: { q: string; a: string }[]; }
export interface ReplayPage { headline: string; summary: string; cta: string; deadline: string; }
export interface FollowupMessage { day: number; label: string; message: string; }
export interface WebinarQuality { score: number; audienceRelevance: number; promiseClarity: number; trustBuilding: number; contentStructure: number; ctaStrength: number; conversionReadiness: number; missingItems: string[]; recommendations: string[]; }
