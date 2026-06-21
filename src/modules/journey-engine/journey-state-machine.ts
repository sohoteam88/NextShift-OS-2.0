import type { AdaptiveJourneyType } from './journey-selector';

export type AdaptiveJourneyMission = {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  estimatedMinutes: number;
  priority: number;
  unlockConditions: string[];
  completionConditions: string[];
  route: string;
};

export type AdaptiveJourneyMissionState = AdaptiveJourneyMission & {
  status: 'completed' | 'active' | 'locked';
  nextMissionId?: string;
};

export type JourneyPathDefinition = {
  journeyType: AdaptiveJourneyType;
  title: string;
  missions: AdaptiveJourneyMission[];
};

const BASE_PROFILE = {
  id: 'MISSION_001',
  title: '资料设置',
  description: '确认你的账号和基础资料，让系统知道谁正在建立业务。',
  expectedOutcome: '你的账号基础资料准备好，可以开始品牌探索。',
  estimatedMinutes: 3,
  priority: 100,
  unlockConditions: [],
  completionConditions: ['registered', 'approved'],
  route: '/settings',
};

const BASE_INTERVIEW = {
  id: 'MISSION_002',
  title: '品牌访谈',
  description: '告诉 AI 你的故事、背景、经验和目标。',
  expectedOutcome: '系统会生成你的品牌 DNA 基础。',
  estimatedMinutes: 8,
  priority: 90,
  unlockConditions: ['approved'],
  completionConditions: ['brand_discovery_completed'],
  route: '/brand-builder/step/interview',
};

const BRAND_DNA = {
  id: 'MISSION_003',
  title: '确认品牌 DNA',
  description: '检查并确认 AI 生成的定位、故事和受众画像。',
  expectedOutcome: '你的内容和客户开发会使用同一份品牌基础。',
  estimatedMinutes: 5,
  priority: 80,
  unlockConditions: ['brand_discovery_completed'],
  completionConditions: ['brand_dna_confirmed'],
  route: '/brand-builder/step/profile',
};

export const JOURNEY_PATHS: Record<AdaptiveJourneyType, JourneyPathDefinition> = {
  creator: {
    journeyType: 'creator',
    title: 'Creator Journey',
    missions: [
      BASE_PROFILE,
      BASE_INTERVIEW,
      BRAND_DNA,
      {
        id: 'MISSION_004',
        title: '内容引擎',
        description: '根据品牌 DNA 生成第一篇能建立信任的内容。',
        expectedOutcome: '你会拥有第一个公开内容资产。',
        estimatedMinutes: 10,
        priority: 70,
        unlockConditions: ['brand_dna_confirmed'],
        completionConditions: ['first_content_generated'],
        route: '/content-engine',
      },
      {
        id: 'MISSION_005',
        title: '发布上线',
        description: '把内容发布出去，开始获得真实受众反馈。',
        expectedOutcome: '你的内容系统正式开始运行。',
        estimatedMinutes: 8,
        priority: 60,
        unlockConditions: ['first_content_generated'],
        completionConditions: ['content_published'],
        route: '/content-engine',
      },
    ],
  },
  service: {
    journeyType: 'service',
    title: 'Service Journey',
    missions: [
      BASE_PROFILE,
      BASE_INTERVIEW,
      {
        id: 'MISSION_003',
        title: 'Offer Builder',
        description: '明确你的服务方案、交付结果和客户承诺。',
        expectedOutcome: '你会有一个可以销售的清晰服务 offer。',
        estimatedMinutes: 12,
        priority: 80,
        unlockConditions: ['brand_discovery_completed'],
        completionConditions: ['positioning_completed'],
        route: '/brand-builder/step/strategy',
      },
      {
        id: 'MISSION_004',
        title: '引流磁铁',
        description: '创建一个免费资源，让目标客户愿意留下联系方式。',
        expectedOutcome: '你的服务开始获得潜在客户。',
        estimatedMinutes: 15,
        priority: 70,
        unlockConditions: ['positioning_completed'],
        completionConditions: ['lead_magnet_created'],
        route: '/lead-magnet',
      },
      {
        id: 'MISSION_005',
        title: '落地页',
        description: '把服务 offer 和引流磁铁连接到转化页面。',
        expectedOutcome: '你会有一个可以接收流量的服务转化入口。',
        estimatedMinutes: 20,
        priority: 60,
        unlockConditions: ['lead_magnet_created'],
        completionConditions: ['funnel_published'],
        route: '/funnel',
      },
      {
        id: 'MISSION_006',
        title: '发布上线',
        description: '启动服务获客路径并开始跟进潜在客户。',
        expectedOutcome: '你的服务业务进入可获客状态。',
        estimatedMinutes: 10,
        priority: 50,
        unlockConditions: ['funnel_published'],
        completionConditions: ['traffic_campaign_launched'],
        route: '/traffic-engine',
      },
    ],
  },
  retail: {
    journeyType: 'retail',
    title: 'Retail Journey',
    missions: [
      BASE_PROFILE,
      BASE_INTERVIEW,
      {
        id: 'MISSION_003',
        title: '产品定位',
        description: '明确你的产品卖点、目标客户和购买理由。',
        expectedOutcome: '你的产品会有清晰的销售角度。',
        estimatedMinutes: 10,
        priority: 80,
        unlockConditions: ['brand_discovery_completed'],
        completionConditions: ['brand_dna_confirmed'],
        route: '/brand-builder/step/profile',
      },
      {
        id: 'MISSION_004',
        title: '内容',
        description: '生成第一篇展示产品价值的内容。',
        expectedOutcome: '你的产品开始获得市场曝光。',
        estimatedMinutes: 10,
        priority: 70,
        unlockConditions: ['brand_dna_confirmed'],
        completionConditions: ['first_content_generated'],
        route: '/content-engine',
      },
      {
        id: 'MISSION_005',
        title: '引流磁铁',
        description: '创建一个能引导客户留下联系方式的免费资源或优惠。',
        expectedOutcome: '你的零售路径开始沉淀客户线索。',
        estimatedMinutes: 15,
        priority: 60,
        unlockConditions: ['first_content_generated'],
        completionConditions: ['lead_magnet_created'],
        route: '/lead-magnet',
      },
      {
        id: 'MISSION_006',
        title: '双漏斗落地页',
        description: '生成零售客户与招募伙伴两条落地页，让内容和引流资源有清晰承接入口。',
        expectedOutcome: '你会拥有可以接收流量的零售页和招募页。',
        estimatedMinutes: 15,
        priority: 50,
        unlockConditions: ['lead_magnet_created'],
        completionConditions: ['funnel_published'],
        route: '/funnel',
      },
      {
        id: 'MISSION_007',
        title: '流量测试',
        description: '把双漏斗落地页推给真实受众，开始测试访问、提交和 WhatsApp 跟进。',
        expectedOutcome: '你的产品开始获得访问和询问。',
        estimatedMinutes: 20,
        priority: 45,
        unlockConditions: ['funnel_published'],
        completionConditions: ['traffic_campaign_launched'],
        route: '/traffic-engine',
      },
      {
        id: 'MISSION_008',
        title: '发布上线',
        description: '完成第一轮产品获客闭环。',
        expectedOutcome: '你的零售业务进入可优化状态。',
        estimatedMinutes: 10,
        priority: 35,
        unlockConditions: ['traffic_campaign_launched'],
        completionConditions: ['first_sale_completed'],
        route: '/dashboard',
      },
    ],
  },
  team_building: {
    journeyType: 'team_building',
    title: 'Team Building Journey',
    missions: [
      BASE_PROFILE,
      BASE_INTERVIEW,
      {
        id: 'MISSION_003',
        title: '权威建设',
        description: '建立你的领导者定位和招募故事。',
        expectedOutcome: '潜在伙伴能理解为什么要跟随你。',
        estimatedMinutes: 12,
        priority: 80,
        unlockConditions: ['brand_discovery_completed'],
        completionConditions: ['brand_dna_confirmed'],
        route: '/brand-builder/step/profile',
      },
      {
        id: 'MISSION_004',
        title: '招募漏斗',
        description: '创建一个面向潜在伙伴的招募路径。',
        expectedOutcome: '你的团队增长有了可复制入口。',
        estimatedMinutes: 20,
        priority: 70,
        unlockConditions: ['brand_dna_confirmed'],
        completionConditions: ['funnel_published'],
        route: '/funnel',
      },
      {
        id: 'MISSION_005',
        title: '流量',
        description: '把招募漏斗推给合适的潜在伙伴。',
        expectedOutcome: '你的团队漏斗开始获得候选人。',
        estimatedMinutes: 20,
        priority: 60,
        unlockConditions: ['funnel_published'],
        completionConditions: ['traffic_campaign_launched'],
        route: '/traffic-engine',
      },
      {
        id: 'MISSION_006',
        title: '发布上线',
        description: '启动招募系统并开始跟进第一批潜在伙伴。',
        expectedOutcome: '你的团队增长系统正式运行。',
        estimatedMinutes: 10,
        priority: 50,
        unlockConditions: ['traffic_campaign_launched'],
        completionConditions: ['growth_mode_active'],
        route: '/team/growth',
      },
    ],
  },
};

function hasAll(checks: Set<string>, conditions: string[]) {
  return conditions.every((condition) => checks.has(condition));
}

export function resolveJourneyStateMachine(
  path: JourneyPathDefinition,
  completedChecks: string[],
): AdaptiveJourneyMissionState[] {
  const checks = new Set(completedChecks);
  let activeAssigned = false;

  return path.missions.map((mission, index) => {
    const completed = hasAll(checks, mission.completionConditions);
    const unlocked = hasAll(checks, mission.unlockConditions);
    const status = completed
      ? 'completed'
      : unlocked && !activeAssigned
        ? 'active'
        : 'locked';

    if (status === 'active') activeAssigned = true;

    return {
      ...mission,
      status,
      nextMissionId: path.missions[index + 1]?.id,
    };
  });
}
