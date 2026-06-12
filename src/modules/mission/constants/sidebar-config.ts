export type MissionSidebarItem = {
  icon: string;
  label_zh: string;
  label_en: string;
  label_ms: string;
  route: string;
  children?: MissionSidebarItem[];
};

export const GUIDED_SIDEBAR: MissionSidebarItem[] = [
  { icon: 'Gauge', label_zh: '仪表盘', label_en: 'Dashboard', label_ms: 'Papan Pemuka', route: '/dashboard' },
  { icon: 'Map', label_zh: '旅程地图', label_en: 'Journey Map', label_ms: 'Peta Perjalanan', route: '/journey' },
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
    route: '/ai',
    children: [
      { icon: 'Wand2', label_zh: 'AI 工具', label_en: 'AI Tools', label_ms: 'Alat AI', route: '/ai' },
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
    route: '/funnel',
    children: [
      { icon: 'LayoutTemplate', label_zh: '漏斗页面', label_en: 'Funnels', label_ms: 'Funnel', route: '/funnel' },
      { icon: 'Zap', label_zh: '漏斗生成器', label_en: 'Funnel Builder', label_ms: 'Pembina Funnel', route: '/ai/funnel-builder' },
    ],
  },
  {
    icon: 'MessageCircle',
    label_zh: '转化',
    label_en: 'Conversion',
    label_ms: 'Penukaran',
    route: '/crm',
    children: [
      { icon: 'ClipboardList', label_zh: '潜在客户', label_en: 'Leads', label_ms: 'Lead', route: '/crm' },
      { icon: 'KanbanSquare', label_zh: '销售管道', label_en: 'Pipeline', label_ms: 'Pipeline', route: '/crm/pipeline' },
      { icon: 'UserCheck', label_zh: '客户管理', label_en: 'Customers', label_ms: 'Pelanggan', route: '/crm/customers' },
    ],
  },
  {
    icon: 'BarChart3',
    label_zh: '分析成长',
    label_en: 'Analytics & Growth',
    label_ms: 'Analitik',
    route: '/analytics',
    children: [
      { icon: 'BarChart3', label_zh: '数据分析', label_en: 'Analytics', label_ms: 'Analitik', route: '/analytics' },
      { icon: 'BookOpenCheck', label_zh: '培训', label_en: 'Training', label_ms: 'Latihan', route: '/member?view=training' },
      { icon: 'Activity', label_zh: '每日行动', label_en: 'Daily Actions', label_ms: 'Tindakan Harian', route: '/member/daily-actions' },
    ],
  },
  { icon: 'Trophy', label_zh: '成就', label_en: 'Achievements', label_ms: 'Pencapaian', route: '/journey' },
  { icon: 'Settings', label_zh: '设置', label_en: 'Settings', label_ms: 'Tetapan', route: '/settings' },
];
