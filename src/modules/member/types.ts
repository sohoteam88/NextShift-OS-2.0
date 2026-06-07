export type OnboardingStep = 'profile' | 'goals' | 'brand' | 'first_content' | 'first_funnel';

export type OnboardingState = {
  completed: boolean;
  current_step: number;
  completed_steps: OnboardingStep[];
  completed_at?: string;
};

export type BrandPositioning = {
  positioning: string;
  content_pillars: string[];
  audience?: string;
  why_this_works?: string;
};

export type FirstContentOption = {
  title: string;
  hook: string;
  content: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'xiaohongshu';
};

export type DailyActionCategory = 'learn' | 'content' | 'crm';

export type DailyActionItem = {
  id: string;
  type: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  category: DailyActionCategory;
};

export type DailyActionDay = {
  date: string;
  actions: DailyActionItem[];
  totalCount: number;
  completedCount: number;
  allCompleted: boolean;
  hasData: boolean;
};

export type TrainingModule = {
  id: string;
  name: string;
  description: string;
  content_url?: string | null;
  order: number;
};

export type TrainingProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type TrainingProgressItem = {
  id: string;
  moduleId: string;
  moduleName: string;
  status: TrainingProgressStatus;
  completedAt: string | null;
};

export type TrainingModuleOverview = TrainingModule & {
  progress: TrainingProgressItem | null;
};

export type TrainingOverview = {
  modules: TrainingModuleOverview[];
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  completionRate: number;
  nextModule: TrainingModuleOverview | null;
};

export type MemberModulePlaceholder = Record<string, never>;
