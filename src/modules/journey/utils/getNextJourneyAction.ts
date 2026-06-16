// Journey V3 — Dynamic next-action resolver
// Maps user progress to the correct next mission with context-specific CTA

export interface JourneyNextAction {
  title: string;
  description: string;
  ctaLabel: string;
  route: string;
  progressStep: number;
  totalSteps: number;
  stageName: string;
  outcomes: string[];
  estimatedMinutes: number;
}

const TOTAL_STEPS = 7;

const STAGES = [
  { step: 1, stageName: '建立品牌身份', check: 'brand_interview' },
  { step: 2, stageName: '设计社交媒体主页', check: 'brand_dna' },
  { step: 3, stageName: '发布第一篇内容', check: 'first_content' },
  { step: 4, stageName: '获得第一位潜在客户', check: 'first_lead' },
  { step: 5, stageName: '完成第一次成交', check: 'first_customer' },
  { step: 6, stageName: '建立跟进系统', check: 'follow_up_system' },
  { step: 7, stageName: '开始复制团队', check: 'first_member' },
];

/**
 * Determine the next journey action based on what the user has completed.
 * Accepts a simple object of boolean flags for each completion check.
 */
export function getNextJourneyAction(completed: {
  brandInterview?: boolean;
  brandDNA?: boolean;
  firstContent?: boolean;
  firstLead?: boolean;
  firstCustomer?: boolean;
  followUpSystem?: boolean;
  firstMember?: boolean;
}): JourneyNextAction {
  const checks: Record<string, boolean> = {
    brand_interview: !!completed.brandInterview,
    brand_dna: !!completed.brandDNA,
    first_content: !!completed.firstContent,
    first_lead: !!completed.firstLead,
    first_customer: !!completed.firstCustomer,
    follow_up_system: !!completed.followUpSystem,
    first_member: !!completed.firstMember,
  };

  // Find the first incomplete stage
  for (const stage of STAGES) {
    if (!checks[stage.check]) {
      return getActionForStage(stage);
    }
  }

  // All complete
  return {
    title: '恭喜完成全部旅程！',
    description: '你已经完成了所有 7 个阶段。继续优化你的业务，探索高级功能。',
    ctaLabel: '查看高级模式',
    route: '/journey?mode=advanced',
    progressStep: 7,
    totalSteps: TOTAL_STEPS,
    stageName: '全部完成',
    outcomes: ['探索高级功能', '帮助团队成员', '优化现有流程'],
    estimatedMinutes: 0,
  };
}

function getActionForStage(stage: (typeof STAGES)[number]): JourneyNextAction {
  switch (stage.check) {
    case 'brand_interview':
      return {
        title: '品牌探索访谈',
        description: '让 AI 了解你的故事、背景和目标客户。这是所有内容生成和客户开发的基础。不用担心选错，系统会一步一步带你完成。',
        ctaLabel: '开始品牌访谈',
        route: '/brand-builder/step/interview',
        progressStep: 1,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['你的品牌定位', '你的内容方向', 'AI 文案生成基础'],
        estimatedMinutes: 10,
      };
    case 'brand_dna':
      return {
        title: '生成品牌 DNA',
        description: 'AI 会根据你的访谈结果，生成完整的品牌身份：定位、受众、内容策略和产品方向。',
        ctaLabel: '生成品牌 DNA',
        route: '/brand-dna',
        progressStep: 2,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['品牌定位文档', '目标客户画像', '内容支柱策略'],
        estimatedMinutes: 3,
      };
    case 'first_content':
      return {
        title: '发布第一篇内容',
        description: '根据你的品牌 DNA，AI 会帮你生成第一篇社交媒体内容。选择平台，一键生成。',
        ctaLabel: '生成第一篇内容',
        route: '/content-engine',
        progressStep: 3,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['第一篇社交媒体帖子', '内容日历模板', '多平台适配版本'],
        estimatedMinutes: 5,
      };
    case 'first_lead':
      return {
        title: '开始客户开发',
        description: '创建你的第一个引流磁铁和漏斗页面，让潜在客户能找到你。',
        ctaLabel: '创建引流磁铁',
        route: '/lead-magnet',
        progressStep: 4,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['引流磁铁页面', '漏斗页面模板', 'WhatsApp 自动回复'],
        estimatedMinutes: 15,
      };
    case 'first_customer':
      return {
        title: '跟进潜在客户',
        description: '使用 AI 跟进系统，自动发送个性化消息，推动第一次成交。',
        ctaLabel: '开始客户跟进',
        route: '/crm',
        progressStep: 5,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['客户跟进模板', '自动回复设置', '成交话术'],
        estimatedMinutes: 10,
      };
    case 'follow_up_system':
      return {
        title: '建立自动跟进系统',
        description: '设置自动化的客户跟进流程，让系统帮你持续维护客户关系。',
        ctaLabel: '设置自动跟进',
        route: '/whatsapp-ai',
        progressStep: 6,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['自动跟进序列', '定时消息模板', '客户分级系统'],
        estimatedMinutes: 10,
      };
    case 'first_member':
      return {
        title: '邀请第一位团队成员',
        description: '生成邀请链接，开始复制你的成功模式。',
        ctaLabel: '邀请团队成员',
        route: '/team',
        progressStep: 7,
        totalSteps: TOTAL_STEPS,
        stageName: stage.stageName,
        outcomes: ['团队邀请链接', '培训模板', '复制清单'],
        estimatedMinutes: 5,
      };
    default:
      return {
        title: '开始你的旅程',
        description: '从品牌访谈开始，一步一步建立你的线上业务。',
        ctaLabel: '开始品牌访谈',
        route: '/brand-builder/step/interview',
        progressStep: 1,
        totalSteps: TOTAL_STEPS,
        stageName: '建立品牌身份',
        outcomes: ['品牌定位', '内容方向', '客户开发'],
        estimatedMinutes: 10,
      };
  }
}
