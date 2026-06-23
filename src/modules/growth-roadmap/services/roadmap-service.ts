import type { EvolutionLevel, EvolutionModule, EvolutionSnapshot } from '@/modules/evolution/types/evolution-snapshot';
import type { GrowthRoadmapState, RoadmapMissionGroup, RoadmapStep, RoadmapStepStatus } from '../types/roadmap.types';

const STEPS: Omit<RoadmapStep, 'status'>[] = [
  { id: 'brand_interview', stepNumber: 1, title: '品牌访谈', description: '告诉 AI 你的故事、目标和受众。', missionId: 'brand_foundation', route: '/brand-builder/step/interview', estimatedTime: '10 分钟', rewards: ['品牌定位', '内容方向'] },
  { id: 'brand_dna', stepNumber: 2, title: '品牌 DNA', description: '生成你完整的品牌身份。', missionId: 'brand_foundation', route: '/brand-builder/step/profile', estimatedTime: '5 分钟', rewards: ['品牌身份', 'AI 个性化'] },
  { id: 'social_setup', stepNumber: 3, title: '社交资料设置', description: '用 Brand DNA 生成用户名、平台 Bio、头像和封面方向。', missionId: 'brand_foundation', route: '/brand-builder/step/accounts', estimatedTime: '8 分钟', rewards: ['社交资料', '简介与封面'] },
  { id: 'first_content', stepNumber: 4, title: '第一篇内容', description: '发布你的第一篇内容。', missionId: 'content_creation', route: '/content-engine', estimatedTime: '10 分钟', rewards: ['曝光度', '受众增长'] },
  { id: 'content_engine', stepNumber: 5, title: '内容引擎', description: '用 AI 规模化内容生产。', missionId: 'content_creation', route: '/content-engine', estimatedTime: '20 分钟', rewards: ['内容日历', '多平台'] },
  { id: 'first_lead', stepNumber: 6, title: '第一个潜在客户', description: '获取你的第一个潜在客户。', missionId: 'lead_generation', route: '/lead-magnet', estimatedTime: '15 分钟', rewards: ['客户管道', '受众列表'] },
  { id: 'lead_engine', stepNumber: 7, title: '客户引擎', description: '建立自动化客户获取系统。', missionId: 'lead_generation', route: '/traffic-engine', estimatedTime: '30 分钟', rewards: ['自动化客户', '流量系统'] },
  { id: 'first_customer', stepNumber: 8, title: '第一个客户', description: '转化你的第一个付费客户。', missionId: 'customer_acquisition', route: '/crm', estimatedTime: '30 分钟', rewards: ['收入', '案例', '信心'] },
  { id: 'follow_up_system', stepNumber: 9, title: '跟进系统', description: '自动化客户跟进。', missionId: 'customer_acquisition', route: '/whatsapp-ai', estimatedTime: '20 分钟', rewards: ['自动化', '一致性'] },
  { id: 'sales_engine', stepNumber: 10, title: '销售引擎', description: '建立可复制的销售流程。', missionId: 'customer_acquisition', route: '/crm', estimatedTime: '30 分钟', rewards: ['销售管道', '收入系统'] },
  { id: 'automation_engine', stepNumber: 11, title: '自动化引擎', description: '端到端自动化工作流程。', missionId: 'system_building', route: '/automation', estimatedTime: '40 分钟', rewards: ['可扩展性', '时间自由'] },
  { id: 'team_building', stepNumber: 12, title: '团队建设', description: '引入你的第一个团队成员。', missionId: 'team_scaling', route: '/team/growth', estimatedTime: '60 分钟', rewards: ['团队成长', '授权分工'] },
  { id: 'leadership', stepNumber: 13, title: '领导力', description: '发展领导能力。', missionId: 'team_scaling', route: '/team/growth', estimatedTime: '持续进行', rewards: ['领导技能', '导师能力'] },
  { id: 'scale', stepNumber: 14, title: '规模化', description: '规模化运营与收入。', missionId: 'team_scaling', route: '/analytics-center', estimatedTime: '持续进行', rewards: ['业务增长', '市场影响力'] },
  { id: 'business_operator', stepNumber: 15, title: '业务运营者', description: '运营一个自我维持的事业。', missionId: 'team_scaling', route: '/dashboard', estimatedTime: '持续进行', rewards: ['完整系统', '财务自由'] },
];

const TOTAL = STEPS.length;

const LEVEL_STEP_BOUNDARY: Record<EvolutionLevel, number> = {
  explorer: 3,
  builder: 5,
  operator: 10,
  leader: 15,
};

const STAGE_START_INDEX: Record<string, number> = {
  brand_foundation: 0,
  content_creation: 3,
  lead_generation: 5,
  customer_acquisition: 7,
  system_building: 10,
  team_scaling: 11,
};

const STEP_UNLOCK_MODULES: Record<string, EvolutionModule[]> = {
  brand_interview: ['brand-builder'],
  brand_dna: ['brand-builder'],
  social_setup: ['brand-builder'],
  first_content: ['content-engine'],
  content_engine: ['content-engine'],
  first_lead: ['lead-engine'],
  lead_engine: ['lead-engine'],
  first_customer: ['crm'],
  follow_up_system: ['sales', 'crm'],
  sales_engine: ['sales', 'crm'],
  automation_engine: ['team'],
  team_building: ['team'],
  leadership: ['team'],
  scale: ['team'],
  business_operator: ['dashboard', 'team'],
};

const MISSION_GROUPS: Array<Pick<RoadmapMissionGroup, 'missionId' | 'title' | 'description'>> = [
  { missionId: 'brand_foundation', title: '品牌基础', description: '建立你的个人品牌基础。' },
  { missionId: 'content_creation', title: '内容创作', description: '发布你的第一篇内容。' },
  { missionId: 'lead_generation', title: '客户开发', description: '获得你的第一个潜在客户。' },
  { missionId: 'customer_acquisition', title: '客户获取', description: '获得你的第一个付费客户。' },
  { missionId: 'system_building', title: '系统建设', description: '创建可复制的系统。' },
  { missionId: 'team_scaling', title: '团队扩展', description: '超越个人能力，建立团队。' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSnapshot(snapshot?: EvolutionSnapshot | null): EvolutionSnapshot {
  return snapshot ?? {
    level: 'explorer',
    progressPercentage: 0,
    currentStage: 'brand_foundation',
    nextLevel: 'builder',
    unlockedModules: ['dashboard', 'journey', 'brand-builder'],
    completedMissions: 0,
    totalMissions: 0,
  };
}

function getStepModules(stepId: string): EvolutionModule[] {
  return STEP_UNLOCK_MODULES[stepId] ?? [];
}

function isStepUnlocked(step: Omit<RoadmapStep, 'status'>, snapshot: EvolutionSnapshot): boolean {
  const levelBoundary = LEVEL_STEP_BOUNDARY[snapshot.level];
  if (step.stepNumber <= levelBoundary) return true;

  const stepModules = getStepModules(step.id);
  if (stepModules.length === 0) return false;

  return stepModules.some(module => snapshot.unlockedModules.includes(module));
}

function getCurrentStepIndex(snapshot: EvolutionSnapshot): number {
  const stageStart = STAGE_START_INDEX[snapshot.currentStage] ?? 0;
  const progressIndex = clamp(Math.floor((snapshot.progressPercentage / 100) * TOTAL), 0, TOTAL - 1);
  return Math.max(stageStart, progressIndex);
}

function getMissionGroupSteps(steps: RoadmapStep[], missionId: string) {
  return steps.filter(step => step.missionId === missionId);
}

function createRoadmapSteps(snapshot: EvolutionSnapshot): RoadmapStep[] {
  const currentIndex = getCurrentStepIndex(snapshot);

  return STEPS.map((step, index) => {
    let status: RoadmapStepStatus;

    if (index < currentIndex) {
      status = 'completed';
    } else if (index === currentIndex) {
      status = 'current';
    } else if (isStepUnlocked(step, snapshot)) {
      status = 'unlocked';
    } else {
      status = 'locked';
    }

    return { ...step, status };
  });
}

export function getGrowthRoadmapState(snapshot?: EvolutionSnapshot | null): GrowthRoadmapState {
  const resolved = normalizeSnapshot(snapshot);
  const steps = createRoadmapSteps(resolved);
  const currentStep = steps.find(step => step.status === 'current') ?? steps[0];
  const nextStep = steps.find(step => step.status === 'unlocked');
  const completedSteps = steps.filter(step => step.status === 'completed').length;

  const missionGroups: RoadmapMissionGroup[] = MISSION_GROUPS.map(group => {
    const groupSteps = getMissionGroupSteps(steps, group.missionId);
    const completedInGroup = groupSteps.filter(step => step.status === 'completed').length;

    return {
      ...group,
      steps: groupSteps,
      progressPercentage: groupSteps.length > 0 ? Math.round((completedInGroup / groupSteps.length) * 100) : 0,
      completed: groupSteps.length > 0 && completedInGroup === groupSteps.length,
    };
  });

  return {
    currentStep,
    nextStep,
    steps,
    missionGroups,
    completedSteps,
    totalSteps: TOTAL,
    progressPercentage: resolved.progressPercentage,
  };
}

export function getRoadmapStepStatus(stepId: string, snapshot?: EvolutionSnapshot | null): RoadmapStepStatus {
  const state = getGrowthRoadmapState(snapshot);
  return state.steps.find(step => step.id === stepId)?.status ?? 'locked';
}
