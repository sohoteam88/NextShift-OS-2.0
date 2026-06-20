import { CANONICAL_ROUTES } from '@/config/canonical-routes';

export type ExecutionRoadmapStepId =
  | 'brand_interview'
  | 'brand_dna'
  | 'ai_coo'
  | 'content_engine'
  | 'lead_magnet'
  | 'funnel_landing_page'
  | 'traffic_test'
  | 'leads'
  | 'crm'
  | 'sales'
  | 'workforce';

export type ExecutionRoadmapStep = {
  id: ExecutionRoadmapStepId;
  order: number;
  label_zh: string;
  label_en: string;
  label_ms: string;
  short_zh: string;
  short_en: string;
  short_ms: string;
  route: string;
  aliases: string[];
  outcome_zh: string;
};

export const EXECUTION_ROADMAP_STEPS: ExecutionRoadmapStep[] = [
  {
    id: 'brand_interview',
    order: 1,
    label_zh: 'AI 访谈',
    label_en: 'AI Interview',
    label_ms: 'Temu Bual AI',
    short_zh: '访谈',
    short_en: 'Interview',
    short_ms: 'Temu Bual',
    route: CANONICAL_ROUTES.brandInterview,
    aliases: ['/brand-builder/step/interview'],
    outcome_zh: '收集故事、产品、目标受众和商业目标',
  },
  {
    id: 'brand_dna',
    order: 2,
    label_zh: 'Brand DNA',
    label_en: 'Brand DNA',
    label_ms: 'Brand DNA',
    short_zh: 'Brand DNA',
    short_en: 'Brand DNA',
    short_ms: 'Brand DNA',
    route: CANONICAL_ROUTES.brandProfile,
    aliases: ['/brand-builder/profile', '/brand-builder/step/profile', '/brand-builder/intelligence'],
    outcome_zh: '确认定位、受众、Offer、故事和信任元素',
  },
  {
    id: 'ai_coo',
    order: 3,
    label_zh: 'AI COO',
    label_en: 'AI COO',
    label_ms: 'AI COO',
    short_zh: 'AI COO',
    short_en: 'AI COO',
    short_ms: 'AI COO',
    route: CANONICAL_ROUTES.dashboard,
    aliases: ['/dashboard', '/ceo-mode'],
    outcome_zh: '判断当前缺口，并给出今天最高杠杆任务',
  },
  {
    id: 'content_engine',
    order: 4,
    label_zh: '内容引擎',
    label_en: 'Content Engine',
    label_ms: 'Enjin Kandungan',
    short_zh: '内容',
    short_en: 'Content',
    short_ms: 'Kandungan',
    route: CANONICAL_ROUTES.contentEngine,
    aliases: ['/content-engine', '/ai/content-plan', '/brand-builder/calendar'],
    outcome_zh: '根据 Brand DNA 和双漏斗生成零售/招募内容',
  },
  {
    id: 'lead_magnet',
    order: 5,
    label_zh: '引流资源',
    label_en: 'Lead Magnet',
    label_ms: 'Magnet Lead',
    short_zh: '引流资源',
    short_en: 'Lead Magnet',
    short_ms: 'Lead Magnet',
    route: CANONICAL_ROUTES.leadMagnet,
    aliases: ['/lead-magnet'],
    outcome_zh: '生成让受众愿意留下资料的领取资源',
  },
  {
    id: 'funnel_landing_page',
    order: 6,
    label_zh: '漏斗落地页',
    label_en: 'Landing Page',
    label_ms: 'Landing Page',
    short_zh: '漏斗',
    short_en: 'Funnel',
    short_ms: 'Funnel',
    route: CANONICAL_ROUTES.funnel,
    aliases: ['/funnel', '/funnel-builder'],
    outcome_zh: '生成零售和招募两条漏斗落地页与跟进文案',
  },
  {
    id: 'traffic_test',
    order: 7,
    label_zh: '流量测试',
    label_en: 'Traffic Test',
    label_ms: 'Ujian Trafik',
    short_zh: '流量',
    short_en: 'Traffic',
    short_ms: 'Trafik',
    route: CANONICAL_ROUTES.trafficEngine,
    aliases: ['/traffic-engine'],
    outcome_zh: '用小预算或自然内容验证流量承接',
  },
  {
    id: 'leads',
    order: 8,
    label_zh: 'Leads',
    label_en: 'Leads',
    label_ms: 'Prospek',
    short_zh: 'Leads',
    short_en: 'Leads',
    short_ms: 'Prospek',
    route: CANONICAL_ROUTES.leads,
    aliases: ['/leads'],
    outcome_zh: '集中查看进入系统的潜在客户',
  },
  {
    id: 'crm',
    order: 9,
    label_zh: 'CRM',
    label_en: 'CRM',
    label_ms: 'CRM',
    short_zh: 'CRM',
    short_en: 'CRM',
    short_ms: 'CRM',
    route: CANONICAL_ROUTES.crm,
    aliases: ['/crm'],
    outcome_zh: '分数、标签、阶段和跟进动作',
  },
  {
    id: 'sales',
    order: 10,
    label_zh: 'Sales',
    label_en: 'Sales',
    label_ms: 'Jualan',
    short_zh: 'Sales',
    short_en: 'Sales',
    short_ms: 'Jualan',
    route: CANONICAL_ROUTES.sales,
    aliases: ['/sales'],
    outcome_zh: '推进成交、处理异议、形成收入',
  },
  {
    id: 'workforce',
    order: 11,
    label_zh: 'Team / Workforce',
    label_en: 'Team / Workforce',
    label_ms: 'Pasukan / Workforce',
    short_zh: 'Team',
    short_en: 'Team',
    short_ms: 'Pasukan',
    route: CANONICAL_ROUTES.aiWorkforce,
    aliases: ['/ai-workforce', '/ai/workforce', '/team', '/team/growth', '/member'],
    outcome_zh: '在有真实执行数据后启动团队和 AI 工作队',
  },
];

export function getExecutionRoadmapLabel(step: ExecutionRoadmapStep, locale: string, short = false) {
  const key = locale.startsWith('ms') ? 'ms' : locale.startsWith('en') ? 'en' : 'zh';
  if (short) {
    if (key === 'ms') return step.short_ms;
    if (key === 'en') return step.short_en;
    return step.short_zh;
  }
  if (key === 'ms') return step.label_ms;
  if (key === 'en') return step.label_en;
  return step.label_zh;
}

export function isExecutionRoadmapStepActive(step: ExecutionRoadmapStep, pathname: string) {
  return step.aliases.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
}
