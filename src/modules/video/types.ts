export type FunnelStage = 'cold_audience' | 'warm_lead' | 'lead_magnet_delivered' | 'webinar_invite' | 'post_webinar' | 'closing';

export type PlatformType = 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'instagram_story' | 'xiaohongshu' | 'youtube_shorts';

export interface VideoProductionInput {
  topic: string;
  content_pillar: string;
  audience_pain: string;
  funnel_stage: FunnelStage;
  platform: PlatformType;
  duration: '15s' | '30s' | '60s' | '90s';
  style: 'talking_head' | 'faceless' | 'broll_voiceover' | 'tutorial' | 'storytelling';
  calendar_id?: string;
  personal_story_excerpt?: string;
}

export interface VideoStrategy {
  recommended_angle: string;
  angle_reason: string;
  emotional_arc: string;
  funnel_stage_alignment: string;
  success_metric: string;
  estimated_completion_rate: 'high' | 'medium' | 'low';
  estimated_completion_reason: string;
}

export interface VideoHook {
  text: string;
  visual_concept: string;
  hook_type: '痛点' | '好奇' | '故事' | '数字' | '反直觉' | '误区' | '冲突';
  alternates: { text: string; hook_type: string }[];
}

export interface ScriptScene {
  scene_number: number;
  time_range: string;
  purpose: string;
  visual: string;
  text_overlay: string;
  voiceover: string;
  emotion: string;
}

export interface MasterScript {
  title: string;
  total_duration: string;
  hook: VideoHook;
  scenes: ScriptScene[];
  cta: ScriptScene;
  pacing_notes: string;
}

export interface VideoProject {
  id: string;
  strategy: VideoStrategy;
  master_script: MasterScript;
  shot_list?: ShotListItem[];
  broll_list?: BRollItem[];
  veo_prompt?: string;
  minimax_prompt?: string;
  capcut_script?: CapCutScript;
  subtitle_srt?: string;
  cta_final?: { text: string; type: string; target: string };
  platform_adaptations?: PlatformAdaptation[];
}

export interface ShotListItem {
  scene_number: number;
  shot_type: string;
  subject: string;
  camera_movement: string;
  duration_seconds: number;
  lighting_note: string;
  props_needed: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BRollItem {
  scene_number: number;
  description: string;
  source_suggestion: 'film_yourself' | 'stock_footage' | 'ai_generated' | 'screen_recording';
  stock_search_terms?: string[];
  duration_seconds: number;
}

export interface AIVideoPrompt {
  scene_number: number;
  prompt: string;
  aspect_ratio: '9:16' | '1:1' | '16:9';
  duration_hint: string;
  style_modifiers: string[];
  negative_prompt?: string;
}

export interface AIVideoPromptResult {
  scenes: AIVideoPrompt[];
  combined: string;
}

export interface CapCutScript {
  edit_instructions: CapCutStep[];
  text_styles: { name: string; usage: string; font_suggestion: string; color: string }[];
  transitions: { between_scenes: string; suggested_transition: string }[];
  music_suggestion: { mood: string; capcut_category: string; bpm_range: string };
  overall_pacing: string;
}

export interface CapCutStep {
  scene_number: number;
  clip_duration: string;
  text_overlay: { content: string; style_name: string; position: 'top' | 'center' | 'bottom'; animation: string };
  effects: string[];
  sound_effect?: string;
}

export interface PlatformAdaptation {
  platform: PlatformType;
  title_or_caption: string;
  hashtags: string[];
  cover_thumbnail_text: string;
  posting_time_suggestion: string;
  platform_specific_notes: string;
}
