export const CANONICAL_ROUTES = {
  dashboard: '/dashboard',
  journey: '/journey',
  brandInterview: '/brand-builder/step/interview',
  brandProfile: '/brand-builder/step/profile',
  brandBuilderProfile: '/brand-builder/profile',
  contentEngine: '/content-engine',
  revenueDrivers: '/revenue-drivers',
  leadMagnet: '/lead-magnet',
  funnel: '/funnel',
  trafficEngine: '/traffic-engine',
  webinarCenter: '/webinar-center',
  leads: '/leads',
  crm: '/crm',
  sales: '/sales',
  whatsappAi: '/whatsapp-ai',
  ceoMode: '/ceo-mode',
  team: '/ai-workforce',
  teamGrowth: '/ai-workforce',
  aiWorkforce: '/ai-workforce',
  settings: '/settings',
  billing: '/billing',
  help: '/help',
} as const;

export type MemberNavigationId =
  | 'today'
  | 'journey'
  | 'brand'
  | 'content'
  | 'growth'
  | 'relationships'
  | 'team'
  | 'settings'
  | 'billing'
  | 'help';

export type MemberNavigationItem = {
  readonly id: MemberNavigationId;
  readonly href: (typeof CANONICAL_ROUTES)[keyof typeof CANONICAL_ROUTES];
  readonly labels: {
    readonly zh: string;
    readonly en: string;
    readonly ms: string;
  };
};

export const MEMBER_PRIMARY_NAVIGATION = [
  { id: 'today', href: CANONICAL_ROUTES.dashboard, labels: { zh: '今日', en: 'Today', ms: 'Hari Ini' } },
  { id: 'journey', href: CANONICAL_ROUTES.journey, labels: { zh: '旅程', en: 'Journey', ms: 'Perjalanan' } },
  { id: 'brand', href: CANONICAL_ROUTES.brandBuilderProfile, labels: { zh: '品牌', en: 'Brand', ms: 'Jenama' } },
  { id: 'content', href: CANONICAL_ROUTES.contentEngine, labels: { zh: '内容', en: 'Content', ms: 'Kandungan' } },
  { id: 'growth', href: CANONICAL_ROUTES.revenueDrivers, labels: { zh: '增长', en: 'Growth', ms: 'Pertumbuhan' } },
  { id: 'relationships', href: CANONICAL_ROUTES.crm, labels: { zh: '客户关系', en: 'Relationships', ms: 'Hubungan' } },
  { id: 'team', href: CANONICAL_ROUTES.aiWorkforce, labels: { zh: '团队', en: 'Team', ms: 'Pasukan' } },
] as const satisfies readonly MemberNavigationItem[];

export const MEMBER_MOBILE_PRIMARY_IDS = [
  'today',
  'content',
  'growth',
  'relationships',
] as const satisfies readonly MemberNavigationId[];

export const MEMBER_MORE_NAVIGATION = [
  MEMBER_PRIMARY_NAVIGATION[1],
  MEMBER_PRIMARY_NAVIGATION[2],
  MEMBER_PRIMARY_NAVIGATION[6],
  { id: 'settings', href: CANONICAL_ROUTES.settings, labels: { zh: '设置', en: 'Settings', ms: 'Tetapan' } },
  { id: 'billing', href: CANONICAL_ROUTES.billing, labels: { zh: '账单', en: 'Billing', ms: 'Bil' } },
  { id: 'help', href: CANONICAL_ROUTES.help, labels: { zh: '帮助', en: 'Help', ms: 'Bantuan' } },
] as const satisfies readonly MemberNavigationItem[];

export type MemberWorkspaceMode = 'retail' | 'recruitment' | (string & {});

export function getMemberNavigationLabel(
  item: MemberNavigationItem,
  locale: string,
  workspaceMode?: MemberWorkspaceMode,
) {
  if (item.id === 'relationships') {
    if (locale.startsWith('zh')) return workspaceMode === 'recruitment' ? '招募关系' : '客户关系';
    if (locale.startsWith('ms')) return workspaceMode === 'recruitment' ? 'Prospek' : 'Pelanggan';
    return workspaceMode === 'recruitment' ? 'Prospects' : 'Customers';
  }

  if (locale.startsWith('zh')) return item.labels.zh;
  if (locale.startsWith('ms')) return item.labels.ms;
  return item.labels.en;
}

export function isMemberNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
