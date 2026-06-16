export type MissionSidebarItem = {
  icon: string;
  label_zh: string;
  label_en: string;
  label_ms: string;
  route: string;
  children?: MissionSidebarItem[];
};

// Level 1: Explorer — only core guidance
export const EXPLORER_SIDEBAR: MissionSidebarItem[] = [
  { icon: 'Gauge', label_zh: '仪表盘', label_en: 'Dashboard', label_ms: 'Papan Pemuka', route: '/dashboard' },
  { icon: 'Map', label_zh: '旅程地图', label_en: 'Journey Map', label_ms: 'Peta Perjalanan', route: '/journey' },
];

// Legacy alias
export const GUIDED_SIDEBAR = EXPLORER_SIDEBAR;

// Level 2: Builder — + Content
export const BUILDER_SIDEBAR: MissionSidebarItem[] = [
  ...EXPLORER_SIDEBAR,
  {
    icon: 'FileText', label_zh: '内容引擎', label_en: 'Content Engine', label_ms: 'Enjin Kandungan',
    route: '/content-engine',
    children: [
      { icon: 'Zap', label_zh: '内容指挥中心', label_en: 'Command Center', label_ms: 'Pusat Kawalan', route: '/content-engine' },
      { icon: 'Wand2', label_zh: 'AI 工具', label_en: 'AI Tools', label_ms: 'Alat AI', route: '/ai' },
      { icon: 'Clapperboard', label_zh: '视频工作室', label_en: 'Video Studio', label_ms: 'Studio Video', route: '/video' },
    ],
  },
];

// Level 3: Operator — + Lead + CRM + Sales
export const OPERATOR_SIDEBAR: MissionSidebarItem[] = [
  ...BUILDER_SIDEBAR,
  {
    icon: 'Megaphone', label_zh: '获客', label_en: 'Acquisition', label_ms: 'Pemerolehan',
    route: '/leads',
    children: [
      { icon: 'Target', label_zh: '客户开发', label_en: 'Lead Engine', label_ms: 'Enjin Lead', route: '/leads' },
      { icon: 'LayoutTemplate', label_zh: '漏斗', label_en: 'Funnels', label_ms: 'Funnel', route: '/funnel' },
    ],
  },
  {
    icon: 'MessageCircle', label_zh: '转化', label_en: 'Conversion', label_ms: 'Penukaran',
    route: '/customers',
    children: [
      { icon: 'UserCheck', label_zh: 'CRM 引擎', label_en: 'CRM Engine', label_ms: 'Enjin CRM', route: '/customers' },
      { icon: 'DollarSign', label_zh: '销售引擎', label_en: 'Sales Engine', label_ms: 'Enjin Jualan', route: '/sales' },
    ],
  },
];

export const ADVANCED_SIDEBAR: MissionSidebarItem[] = [
  { icon: 'Gauge', label_zh: '仪表盘', label_en: 'Dashboard', label_ms: 'Papan Pemuka', route: '/dashboard' },
  { icon: 'Map', label_zh: '旅程地图', label_en: 'Journey Map', label_ms: 'Peta Perjalanan', route: '/journey' },
  {
    icon: 'Target',
    label_zh: '品牌建设',
    label_en: 'Brand Building',
    label_ms: 'Bina Jenama',
    route: '/brand-builder/profile',
    children: [
      { icon: 'UserCog', label_zh: '品牌画像', label_en: 'Brand Profile', label_ms: 'Profil Jenama', route: '/brand-builder/profile' },
      { icon: 'MessagesSquare', label_zh: '重新访谈', label_en: 'Restart Interview', label_ms: 'Temu Bual Semula', route: '/brand-builder/step/interview' },
      { icon: 'MapPin', label_zh: '设置指南', label_en: 'Setup Guides', label_ms: 'Panduan', route: '/brand-builder/guides' },
    ],
  },
  {
    icon: 'FileText',
    label_zh: '内容引擎',
    label_en: 'Content Engine',
    label_ms: 'Enjin Kandungan',
    route: '/content-engine',
    children: [
      { icon: 'Wand2', label_zh: 'AI 工具', label_en: 'AI Tools', label_ms: 'Alat AI', route: '/ai' },
      { icon: 'Zap', label_zh: '内容指挥中心', label_en: 'Command Center', label_ms: 'Pusat Kawalan', route: '/content-engine' },
      { icon: 'Calendar', label_zh: '内容日历', label_en: 'Content Calendar', label_ms: 'Kalendar Kandungan', route: '/brand-builder/calendar' },
      { icon: 'Clapperboard', label_zh: '视频工作室', label_en: 'Video Studio', label_ms: 'Studio Video', route: '/video' },
      { icon: 'LineChart', label_zh: '内容分析', label_en: 'Content Analytics', label_ms: 'Analitik Kandungan', route: '/brand-builder/insights' },
    ],
  },
  {
    icon: 'Megaphone',
    label_zh: '获客',
    label_en: 'Acquisition',
    label_ms: 'Pemerolehan',
    route: '/leads',
    children: [
      { icon: 'Target', label_zh: '客户开发', label_en: 'Lead Engine', label_ms: 'Enjin Lead', route: '/leads' },
      { icon: 'LayoutTemplate', label_zh: '漏斗页面', label_en: 'Funnels', label_ms: 'Funnel', route: '/funnel' },
      { icon: 'Zap', label_zh: '漏斗生成器', label_en: 'Funnel Builder', label_ms: 'Pembina Funnel', route: '/ai/funnel-builder' },
    ],
  },
  {
    icon: 'MessageCircle',
    label_zh: '客户转化',
    label_en: 'Conversion',
    label_ms: 'Penukaran',
    route: '/customers',
    children: [
      { icon: 'UserCheck', label_zh: 'CRM 引擎', label_en: 'CRM Engine', label_ms: 'Enjin CRM', route: '/customers' },
      { icon: 'DollarSign', label_zh: '销售引擎', label_en: 'Sales Engine', label_ms: 'Enjin Jualan', route: '/sales' },
      { icon: 'ClipboardList', label_zh: '潜在客户列表', label_en: 'Lead List', label_ms: 'Senarai Lead', route: '/crm' },
      { icon: 'KanbanSquare', label_zh: '销售管道', label_en: 'Pipeline', label_ms: 'Pipeline', route: '/crm/pipeline' },
    ],
  },
  {
    icon: 'BarChart3',
    label_zh: '分析成长',
    label_en: 'Analytics & Growth',
    label_ms: 'Analitik',
    route: '/team/growth',
    children: [
      { icon: 'Users', label_zh: '团队成长', label_en: 'Team Growth', label_ms: 'Pertumbuhan Pasukan', route: '/team/growth' },
      { icon: 'BarChart3', label_zh: '数据分析', label_en: 'Analytics', label_ms: 'Analitik', route: '/analytics' },
      { icon: 'BookOpenCheck', label_zh: '培训', label_en: 'Training', label_ms: 'Latihan', route: '/member?view=training' },
      { icon: 'Activity', label_zh: '每日行动', label_en: 'Daily Actions', label_ms: 'Tindakan Harian', route: '/member/daily-actions' },
    ],
  },
  { icon: 'Trophy', label_zh: '成就', label_en: 'Achievements', label_ms: 'Pencapaian', route: '/journey' },
  { icon: 'Settings', label_zh: '设置', label_en: 'Settings', label_ms: 'Tetapan', route: '/settings' },
];
