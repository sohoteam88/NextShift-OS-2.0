export type FunnelBuilderType = 'lead_magnet' | 'webinar' | 'whatsapp' | 'consultation' | 'challenge';
export type FunnelStatus = 'draft' | 'ready' | 'launched' | 'optimizing';
export type FunnelTrack = 'retail' | 'recruitment';

export interface FunnelPackage {
  id: string; funnelType: FunnelBuilderType; track?: FunnelTrack; title: string;
  /** Brand DNA version used to generate this package; legacy packages resolve to v1. */
  brandDnaVersion?: number;
  landingPage: LandingPage; thankYouPage: ThankYouPage;
  whatsappFlow: WhatsAppFlow; emailSequence: EmailMessage[];
  adAngles: AdAngle[]; launchPlan: LaunchDay[];
  healthScore: number; nextBestAction: string;
  status: FunnelStatus; createdAt: string; updatedAt: string;
}

export interface FunnelPortfolio {
  retail: FunnelPackage | null;
  recruitment: FunnelPackage | null;
  activeTrack: FunnelTrack;
  /** Current canonical Brand DNA version used for published-asset comparisons. */
  currentBrandDnaVersion?: number;
  readiness?: FunnelBuilderReadiness;
}

export interface FunnelBuilderReadiness {
  brandDnaReady: boolean;
  contentPlanReady: boolean;
  leadMagnetReady: boolean;
  retailLandingPageReady: boolean;
  recruitmentLandingPageReady: boolean;
}

export interface LandingPage {
  headline: string;
  subheadline: string;
  heroCta: string;
  problem: string;
  solution: string;
  benefits: string[];
  credibility: string;
  leadBlock: string;
  faq: { q: string; a: string }[];
  finalCta: string;
  funnelId?: string;
  publicPath?: string;
  publishedAt?: string;
}
export interface ThankYouPage { confirmation: string; nextStep: string; whatsappCta: string; calendarPlaceholder: string; expectation: string; bonusReminder: string; }
export interface WhatsAppFlow { prefilledMessage: string; firstReply: string; qualificationQuestions: string[]; followUpFlow: string; objectionHandling: string[]; appointmentCta: string; }
export interface EmailMessage { order: number; type: string; subject: string; preview: string; body: string; cta: string; }
export interface AdAngle { platform: string; hook: string; painPoint: string; promise: string; creativeDirection: string; cta: string; funnelStage: string; }
export interface LaunchDay { day: number; title: string; task: string; }
export interface FunnelHealth { score: number; audienceFit: number; offerClarity: number; pageClarity: number; ctaStrength: number; trustElements: number; followUpReadiness: number; trafficReadiness: number; missingItems: string[]; recommendations: string[]; }

// ─── Page-specific types (funnel-builder page) ────────────────────────────────

import type { FunnelBuilderInput, FunnelBuilderOutput } from '@/modules/ai/services/funnel-builder-service';
import type { CaseStudy, StrategyContext } from '@/modules/funnel/types/strategy-context';

export type GenerateResult = {
  funnel: FunnelBuilderOutput;
  tokensUsed: number;
  provider: string;
  model: string;
  savedFunnelId?: string;
  strategyContext?: StrategyContext;
  qualityGateResults?: { passed: boolean; pass_rate: number };
};

export type SavedFunnelRow = {
  id: string;
  title: string;
  createdAt: string;
  config: {
    strategy_context?: StrategyContext;
    quality_gate_results?: { passed: boolean; pass_rate: number };
    ai_generated?: {
      source?: string;
      input?: FunnelBuilderInput;
      output?: FunnelBuilderOutput;
      generated_at?: string;
    };
  };
};

export type RealMaterialForm = {
  founder_story: string;
  case_studies: CaseStudy[];
  common_objections: string[];
  competitors_mentioned: string;
};

// ─── Funnel type registry ─────────────────────────────────────────────────────

export const FUNNEL_TYPES: Record<FunnelBuilderType, { label: string; useCase: string; assets: string; action: string; cta: string }> = {
  lead_magnet: { label: '引流资源漏斗', useCase: '适合用免费资源吸引潜在客户', assets: '引流资源 + 着陆页 + 感谢页', action: '下载资源 → 客户跟进中心', cta: '立即获取' },
  webinar: { label: 'Webinar 漏斗', useCase: '适合用讲座内容建立信任和成交', assets: 'Webinar + 注册页 + 回放页', action: '注册 → 参加 → 预约咨询', cta: '立即注册' },
  whatsapp: { label: 'WhatsApp 漏斗', useCase: '适合直接对话和快速成交', assets: 'WhatsApp预设消息 + 跟进脚本', action: '点击WhatsApp → 自动开场 → 成交', cta: 'WhatsApp 咨询' },
  consultation: { label: '咨询漏斗', useCase: '适合高单价服务', assets: '着陆页 + 预约系统 + 感谢页', action: '了解 → 预约 → 咨询 → 成交', cta: '预约咨询' },
  challenge: { label: '挑战漏斗', useCase: '适合社群和互动型获客', assets: '挑战规则 + 社群 + 结果展示', action: '报名 → 参与 → 结果 → 升级', cta: '加入挑战' },
};
