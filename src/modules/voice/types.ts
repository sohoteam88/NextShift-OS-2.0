export type VoiceCaptureStatus =
  | 'uploaded'
  | 'recording'
  | 'transcribing'
  | 'extracting'
  | 'review'
  | 'approved'
  | 'failed';

export type VoiceLanguage = 'zh' | 'en' | 'ms';

export interface VoiceExtractionData {
  summary: string;
  pain_points: string[];
  health_goals: string[];
  story_angle: string;
  content_pillars: string[];
  background: string;
  motivation: string;
  preferred_topics: string[];
  tone: string;
  language: VoiceLanguage;
  duration_secs: number;
  source_language?: string | null;
  source_file_name?: string | null;
}

export interface VoiceRecord {
  id: string;
  tenantId: string;
  userId: string;
  audioUrl: string;
  audioPath: string;
  transcript: string | null;
  extractedData: VoiceExtractionData | null;
  status: VoiceCaptureStatus;
  createdAt: string;
  updatedAt: string;
  language: VoiceLanguage;
  durationSecs: number | null;
}

export interface VoiceReviewUpdateInput {
  transcript?: string;
  extractedData?: Partial<VoiceExtractionData>;
  status?: Extract<VoiceCaptureStatus, 'review' | 'failed'>;
}

export interface VoiceUploadResult {
  data: VoiceRecord;
}

export interface VoiceListResult {
  data: VoiceRecord[];
  meta: {
    total: number;
    todayCount: number;
    limitPerDay: number | null;
  };
}
