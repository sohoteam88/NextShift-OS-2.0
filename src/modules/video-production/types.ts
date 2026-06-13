// Types for Video Production Engine
// Extends existing VideoProject Prisma model

export type VideoPlatform = 'facebook_reels' | 'instagram_reels' | 'tiktok' | 'youtube_shorts' | 'xhs_video';
export type VideoType = 'personal_story' | 'education' | 'objection_handling' | 'transformation' | 'lifestyle' | 'invitation' | 'testimonial' | 'comparison' | 'myth_busting';
export type VideoFunnelStage = 'awareness' | 'trust_building' | 'consideration' | 'conversion' | 'follow_up';
export type VideoDuration = 15 | 30 | 45 | 60;
export type VideoStatus = 'draft' | 'scripted' | 'produced' | 'published';

export interface VideoBrief {
  contentPillar: string;
  audiencePain: string;
  funnelStage: VideoFunnelStage;
  platformType: VideoPlatform;
  videoType: VideoType;
  videoLength: VideoDuration;
  tone: string;
  ctaGoal: string;
}

export interface VideoStrategy {
  goal: string;
  targetViewer: string;
  coreMessage: string;
  emotionalAngle: string;
  contentAngle: string;
  retentionStrategy: string;
  ctaStrategy: string;
}

export interface HookOption {
  type: 'pain' | 'curiosity' | 'story' | 'contradiction' | 'benefit';
  text: string;
}

export interface ScriptScene {
  sceneNumber: number;
  duration: number;
  visualDirection: string;
  cameraAngle: string;
  action: string;
  spokenLine: string;
  onScreenText: string;
}

export interface BrollItem {
  type: 'required' | 'optional';
  description: string;
  keywords: string;
}

export interface PlatformAdaptation {
  platform: VideoPlatform;
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  postingNote: string;
}

export interface VideoQualityResult {
  score: number;
  hookStrength: number;
  brandAlignment: number;
  audiencePainRelevance: number;
  scriptClarity: number;
  visualFeasibility: number;
  ctaClarity: number;
  platformFit: number;
  missingItems: string[];
  recommendations: string[];
}

export interface VideoPackage {
  brief: VideoBrief;
  strategy: VideoStrategy;
  hooks: HookOption[];
  selectedHook: string;
  masterScript: string;
  shotList: ScriptScene[];
  brollList: BrollItem[];
  veoPrompt: string;
  minimaxPrompt: string;
  capcutScript: string;
  subtitles: string;
  platformAdaptations: PlatformAdaptation[];
  qualityScore: number;
  status: VideoStatus;
}
