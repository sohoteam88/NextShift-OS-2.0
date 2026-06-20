import { CANONICAL_ROUTES } from '@/config/canonical-routes';
import {
  extractCheckKeys,
  getCompletionDate,
  type CompletedCheckEntry,
  type CompletedChecksValue,
} from '@/modules/mission/utils/completed-checks';

export type JourneyStageId =
  | 'register'
  | 'admin_approve'
  | 'brand_discovery'
  | 'brand_dna'
  | 'positioning'
  | 'fb_page_setup'
  | 'ig_account_setup'
  | 'generate_bio'
  | 'generate_avatar'
  | 'first_content'
  | 'first_video'
  | 'publish_content'
  | 'lead_magnet'
  | 'webinar'
  | 'funnel'
  | 'traffic_campaign'
  | 'whatsapp_followup'
  | 'crm_setup'
  | 'first_sale'
  | 'growth_mode';

export type JourneyCategory =
  | 'setup'
  | 'brand'
  | 'social'
  | 'content'
  | 'acquisition'
  | 'conversion'
  | 'growth';

export interface JourneyStage {
  id: JourneyStageId;
  order: number;
  name_zh: string;
  name_en: string;
  name_ms: string;
  category: JourneyCategory;
  description_zh: string;
  description_en: string;
  description_ms: string;
  estimated_minutes: number;
  route: string;
  completion_check: string;
  prerequisites: JourneyStageId[];
  is_milestone: boolean;
  xp_reward: number;
}

export { extractCheckKeys, getCompletionDate };
export type { CompletedCheckEntry, CompletedChecksValue };

export const JOURNEY_MAP: JourneyStage[] = [
  {
    id: 'register',
    order: 1,
    name_zh: '注册账号',
    name_en: 'Register',
    name_ms: 'Daftar',
    category: 'setup',
    description_zh: '创建你的账号，加入团队',
    description_en: 'Create your account and join the team',
    description_ms: 'Cipta akaun anda dan sertai pasukan',
    estimated_minutes: 2,
    route: '/register',
    completion_check: 'registered',
    prerequisites: [],
    is_milestone: false,
    xp_reward: 10,
  },
  {
    id: 'admin_approve',
    order: 2,
    name_zh: '等待审核',
    name_en: 'Admin Approval',
    name_ms: 'Kelulusan Admin',
    category: 'setup',
    description_zh: '管理员审核你的账号，通常在24小时内完成',
    description_en: 'Admin reviews your account, usually within 24 hours',
    description_ms: 'Admin akan menyemak akaun anda dalam 24 jam',
    estimated_minutes: 0,
    route: '/pending',
    completion_check: 'approved',
    prerequisites: ['register'],
    is_milestone: false,
    xp_reward: 0,
  },
  {
    id: 'brand_discovery',
    order: 3,
    name_zh: 'AI 品牌探索访谈',
    name_en: 'AI Brand Discovery',
    name_ms: 'Penemuan Jenama AI',
    category: 'brand',
    description_zh: '通过语音或文字告诉 AI 你的故事，AI 会帮你找到品牌定位',
    description_en: 'Tell AI your story by voice or text, AI will find your brand positioning',
    description_ms: 'Beritahu AI kisah anda, AI akan membantu mencari kedudukan jenama anda',
    estimated_minutes: 5,
    route: CANONICAL_ROUTES.brandInterview,
    completion_check: 'brand_discovery_completed',
    prerequisites: ['admin_approve'],
    is_milestone: true,
    xp_reward: 50,
  },
  {
    id: 'brand_dna',
    order: 4,
    name_zh: '确认品牌 DNA',
    name_en: 'Confirm Brand DNA',
    name_ms: 'Sahkan DNA Jenama',
    category: 'brand',
    description_zh: 'AI 根据访谈生成了你的品牌定位、故事、目标受众，确认或调整',
    description_en: 'AI generated your positioning, story, and audience - confirm or adjust',
    description_ms: 'AI menjana kedudukan, kisah dan audiens anda - sahkan atau laraskan',
    estimated_minutes: 5,
    route: CANONICAL_ROUTES.brandProfile,
    completion_check: 'brand_dna_confirmed',
    prerequisites: ['brand_discovery'],
    is_milestone: true,
    xp_reward: 50,
  },
  {
    id: 'positioning',
    order: 5,
    name_zh: '建立个人定位',
    name_en: 'Build Positioning',
    name_ms: 'Bina Kedudukan',
    category: 'brand',
    description_zh: '明确你的价值主张和差异化，这是所有内容的基础',
    description_en: 'Clarify your value proposition and differentiator - the foundation for all content',
    description_ms: 'Jelaskan cadangan nilai dan pembeza anda',
    estimated_minutes: 5,
    route: '/brand-builder/step/strategy',
    completion_check: 'positioning_completed',
    prerequisites: ['brand_dna'],
    is_milestone: false,
    xp_reward: 30,
  },
  {
    id: 'fb_page_setup',
    order: 6,
    name_zh: '建立 Facebook Page',
    name_en: 'Set Up Facebook Page',
    name_ms: 'Sediakan Facebook Page',
    category: 'social',
    description_zh: '跟着指引创建你的 Facebook 主页，这是你的第一个数字门面',
    description_en: 'Follow the guide to create your Facebook Page - your first digital storefront',
    description_ms: 'Ikuti panduan untuk mencipta Facebook Page anda',
    estimated_minutes: 10,
    route: '/brand-builder/step/guides?platform=facebook',
    completion_check: 'fb_page_completed',
    prerequisites: ['positioning'],
    is_milestone: false,
    xp_reward: 20,
  },
  {
    id: 'ig_account_setup',
    order: 7,
    name_zh: '建立 Instagram 账号',
    name_en: 'Set Up Instagram',
    name_ms: 'Sediakan Instagram',
    category: 'social',
    description_zh: '设置你的 Instagram 专业账号',
    description_en: 'Set up your Instagram professional account',
    description_ms: 'Sediakan akaun profesional Instagram anda',
    estimated_minutes: 8,
    route: '/brand-builder/step/guides?platform=instagram',
    completion_check: 'ig_account_completed',
    prerequisites: ['positioning'],
    is_milestone: false,
    xp_reward: 20,
  },
  {
    id: 'generate_bio',
    order: 8,
    name_zh: '生成 Bio 简介',
    name_en: 'Generate Bio',
    name_ms: 'Jana Bio',
    category: 'social',
    description_zh: 'AI 为每个平台生成专业的简介文案',
    description_en: 'AI generates professional bios for each platform',
    description_ms: 'AI menjana bio profesional untuk setiap platform',
    estimated_minutes: 3,
    route: '/brand-builder/step/accounts',
    completion_check: 'bio_generated',
    prerequisites: ['fb_page_setup', 'ig_account_setup'],
    is_milestone: false,
    xp_reward: 15,
  },
  {
    id: 'generate_avatar',
    order: 9,
    name_zh: '设置头像和封面',
    name_en: 'Set Avatar & Cover',
    name_ms: 'Tetapkan Avatar & Kafilah',
    category: 'social',
    description_zh: '根据 AI 建议设置你的头像和封面图，建立专业形象',
    description_en: 'Set your avatar and cover photo per AI guidance for a professional look',
    description_ms: 'Tetapkan avatar dan gambar penutup anda',
    estimated_minutes: 10,
    route: '/brand-builder/step/accounts',
    completion_check: 'avatar_completed',
    prerequisites: ['generate_bio'],
    is_milestone: true,
    xp_reward: 25,
  },
  {
    id: 'first_content',
    order: 10,
    name_zh: '生成第一篇内容',
    name_en: 'Generate First Content',
    name_ms: 'Jana Kandungan Pertama',
    category: 'content',
    description_zh: 'AI 根据你的品牌定位生成第一篇社交媒体内容',
    description_en: 'AI generates your first social media content based on your brand',
    description_ms: 'AI menjana kandungan media sosial pertama anda',
    estimated_minutes: 5,
    route: CANONICAL_ROUTES.contentEngine,
    completion_check: 'first_content_generated',
    prerequisites: ['generate_avatar'],
    is_milestone: false,
    xp_reward: 20,
  },
  {
    id: 'first_video',
    order: 11,
    name_zh: '生成第一支视频文案',
    name_en: 'Generate First Video Script',
    name_ms: 'Jana Skrip Video Pertama',
    category: 'content',
    description_zh: 'AI 生成你的第一支短视频脚本，包括Hook、画面和文案',
    description_en: 'AI generates your first short video script with hook, scenes, and copy',
    description_ms: 'AI menjana skrip video pendek pertama anda',
    estimated_minutes: 8,
    route: '/video/new',
    completion_check: 'first_video_generated',
    prerequisites: ['first_content'],
    is_milestone: false,
    xp_reward: 20,
  },
  {
    id: 'publish_content',
    order: 12,
    name_zh: '发布内容',
    name_en: 'Publish Content',
    name_ms: 'Terbitkan Kandungan',
    category: 'content',
    description_zh: '把生成的内容发到你的社交媒体，这是你的第一次公开亮相',
    description_en: 'Post your generated content to your social media - your first public appearance',
    description_ms: 'Siarkan kandungan anda ke media sosial',
    estimated_minutes: 5,
    route: '/brand-builder/calendar',
    completion_check: 'content_published',
    prerequisites: ['first_video'],
    is_milestone: true,
    xp_reward: 40,
  },
  {
    id: 'lead_magnet',
    order: 13,
    name_zh: '建立引流资源',
    name_en: 'Build Lead Magnet',
    name_ms: 'Bina Magnet Pelanggan',
    category: 'acquisition',
    description_zh: '创建一个免费资源吸引潜在客户留下联系方式',
    description_en: 'Create a free resource to attract leads to leave contact info',
    description_ms: 'Cipta sumber percuma untuk menarik bakal pelanggan',
    estimated_minutes: 10,
    route: CANONICAL_ROUTES.leadMagnet,
    completion_check: 'lead_magnet_created',
    prerequisites: ['publish_content'],
    is_milestone: false,
    xp_reward: 30,
  },
  {
    id: 'webinar',
    order: 14,
    name_zh: '建立 Webinar',
    name_en: 'Build Webinar',
    name_ms: 'Bina Webinar',
    category: 'acquisition',
    description_zh: '准备你的成交工具-一个能展示价值并促成行动的讲座',
    description_en: 'Prepare your conversion tool - a talk that demonstrates value and drives action',
    description_ms: 'Sediakan alat penukaran anda - webinar',
    estimated_minutes: 20,
    route: '/webinar',
    completion_check: 'webinar_created',
    prerequisites: ['lead_magnet'],
    is_milestone: false,
    xp_reward: 40,
  },
  {
    id: 'funnel',
    order: 15,
    name_zh: '建立完整漏斗',
    name_en: 'Build Funnel',
    name_ms: 'Bina Funnel',
    category: 'acquisition',
    description_zh: '把引流资源和 Webinar 组装成完整的获客漏斗',
    description_en: 'Assemble your Lead Magnet and Webinar into a complete acquisition funnel',
    description_ms: 'Susun Magnet Pelanggan dan Webinar anda menjadi funnel lengkap',
    estimated_minutes: 15,
    route: CANONICAL_ROUTES.funnel,
    completion_check: 'funnel_published',
    prerequisites: ['webinar'],
    is_milestone: true,
    xp_reward: 50,
  },
  {
    id: 'traffic_campaign',
    order: 16,
    name_zh: '启动流量campaign',
    name_en: 'Launch Traffic Campaign',
    name_ms: 'Lancarkan Kempen Trafik',
    category: 'acquisition',
    description_zh: '把你的漏斗推送给目标受众，开始获取真实流量',
    description_en: 'Push your funnel to your target audience and start getting real traffic',
    description_ms: 'Hantar funnel anda kepada audiens sasaran',
    estimated_minutes: 15,
    route: CANONICAL_ROUTES.trafficEngine,
    completion_check: 'campaign_launched',
    prerequisites: ['funnel'],
    is_milestone: false,
    xp_reward: 30,
  },
  {
    id: 'whatsapp_followup',
    order: 17,
    name_zh: '设置 WhatsApp AI 跟进',
    name_en: 'Set Up WhatsApp AI Follow-up',
    name_ms: 'Sediakan Susulan AI WhatsApp',
    category: 'conversion',
    description_zh: '让 AI 帮你自动回应和跟进潜在客户的WhatsApp消息',
    description_en: 'Let AI automatically respond to and follow up on WhatsApp leads',
    description_ms: 'Biarkan AI membalas dan menyusuli mesej WhatsApp',
    estimated_minutes: 10,
    route: '/whatsapp-ai',
    completion_check: 'whatsapp_ai_configured',
    prerequisites: ['traffic_campaign'],
    is_milestone: false,
    xp_reward: 30,
  },
  {
    id: 'crm_setup',
    order: 18,
    name_zh: '管理 CRM',
    name_en: 'Manage CRM',
    name_ms: 'Urus CRM',
    category: 'conversion',
    description_zh: '在 CRM 里追踪每个潜在客户的状态，确保没有人被遗漏',
    description_en: 'Track every lead status in CRM so no one falls through the cracks',
    description_ms: 'Jejaki status setiap bakal pelanggan dalam CRM',
    estimated_minutes: 5,
    route: CANONICAL_ROUTES.crm,
    completion_check: 'crm_active',
    prerequisites: ['whatsapp_followup'],
    is_milestone: false,
    xp_reward: 20,
  },
  {
    id: 'first_sale',
    order: 19,
    name_zh: '第一次成交',
    name_en: 'First Sale',
    name_ms: 'Jualan Pertama',
    category: 'conversion',
    description_zh: '恭喜！把第一个客户在 CRM 中标记为成交',
    description_en: 'Congratulations! Mark your first customer as converted in CRM',
    description_ms: 'Tahniah! Tandakan pelanggan pertama anda sebagai ditukar',
    estimated_minutes: 0,
    route: '/crm/pipeline',
    completion_check: 'first_sale_completed',
    prerequisites: ['crm_setup'],
    is_milestone: true,
    xp_reward: 100,
  },
  {
    id: 'growth_mode',
    order: 20,
    name_zh: '进入增长模式',
    name_en: 'Growth Mode',
    name_ms: 'Mod Pertumbuhan',
    category: 'growth',
    description_zh: '你已经完成了核心系统！现在专注于扩大规模-更多内容、更多流量、更多团队成员',
    description_en: 'You completed the core system! Now focus on scale - more content, more traffic, more team members',
    description_ms: 'Anda telah menyelesaikan sistem teras! Sekarang fokus pada skala',
    estimated_minutes: 0,
    route: CANONICAL_ROUTES.dashboard,
    completion_check: 'growth_mode_active',
    prerequisites: ['first_sale'],
    is_milestone: true,
    xp_reward: 100,
  },
];

export function getStageById(id: JourneyStageId): JourneyStage | undefined {
  return JOURNEY_MAP.find((stage) => stage.id === id);
}

export function getNextStage(completedChecks: CompletedChecksValue): JourneyStage | null {
  const checkKeys = extractCheckKeys(completedChecks);
  for (const stage of JOURNEY_MAP) {
    if (checkKeys.includes(stage.completion_check)) continue;

    const prereqsMet = stage.prerequisites.every((prereqId) => {
      const prereqStage = getStageById(prereqId);
      return prereqStage ? checkKeys.includes(prereqStage.completion_check) : true;
    });

    if (prereqsMet) return stage;
  }

  return null;
}

export function getProgressPercent(completedChecks: CompletedChecksValue): number {
  const checkKeys = extractCheckKeys(completedChecks);
  const userStages = JOURNEY_MAP.filter((stage) => stage.id !== 'admin_approve');
  const completed = userStages.filter((stage) => checkKeys.includes(stage.completion_check)).length;
  return Math.round((completed / userStages.length) * 100);
}

export function getTotalXP(completedChecks: CompletedChecksValue): number {
  const checkKeys = extractCheckKeys(completedChecks);
  return JOURNEY_MAP.filter((stage) => checkKeys.includes(stage.completion_check)).reduce(
    (sum, stage) => sum + stage.xp_reward,
    0,
  );
}

export function getStagesByCategory(): Record<JourneyCategory, JourneyStage[]> {
  const grouped = {} as Record<JourneyCategory, JourneyStage[]>;

  for (const stage of JOURNEY_MAP) {
    grouped[stage.category] ??= [];
    grouped[stage.category].push(stage);
  }

  return grouped;
}
