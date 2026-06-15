// Growth Roadmap Service — 15-step business building path
// Integrates User Evolution + Mission Engine + Journey actions

import type { RoadmapStep, RoadmapMissionGroup, GrowthRoadmapState, RoadmapStepStatus } from '../types/roadmap.types';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';
import { ALL_MILESTONES } from '@/modules/user-evolution/services/milestone-service';
import { getUserLevel } from '@/modules/user-evolution/services/user-level-service';
import { getUnlockedModules } from '@/modules/user-evolution/services/unlock-service';

// ─── 15-Step Roadmap Definition ──────────────────────────────────────────────

const STEPS: Omit<RoadmapStep, 'status'>[] = [
  { id: 'brand_interview', stepNumber: 1, title: '品牌访谈', description: '告诉 AI 你的故事、目标和受众。', missionId: 'brand_foundation', route: '/brand-builder/step/interview', estimatedTime: '10 分钟', rewards: ['品牌定位', '内容方向'] },
  { id: 'brand_dna', stepNumber: 2, title: '品牌 DNA', description: '生成你完整的品牌身份。', missionId: 'brand_foundation', route: '/brand-dna', estimatedTime: '5 分钟', rewards: ['品牌身份', 'AI 个性化'] },
  { id: 'social_setup', stepNumber: 3, title: '社交媒体设置', description: '建立你的社交媒体存在。', missionId: 'brand_foundation', route: '/social-setup', estimatedTime: '15 分钟', rewards: ['社交资料', '简介与封面'] },
  { id: 'first_content', stepNumber: 4, title: '第一篇内容', description: '发布你的第一篇内容。', missionId: 'content_creation', route: '/content-engine', estimatedTime: '10 分钟', rewards: ['曝光度', '受众增长'] },
  { id: 'content_engine', stepNumber: 8, title: '内容引擎', description: '用 AI 规模化内容生产。', missionId: 'content_creation', route: '/content-engine', estimatedTime: '20 分钟', rewards: ['内容日历', '多平台'] },
  { id: 'first_lead', stepNumber: 5, title: '第一个潜在客户', description: '获取你的第一个潜在客户。', missionId: 'lead_generation', route: '/lead-magnet', estimatedTime: '15 分钟', rewards: ['客户管道', '受众列表'] },
  { id: 'lead_engine', stepNumber: 9, title: '客户引擎', description: '建立自动化客户获取系统。', missionId: 'lead_generation', route: '/traffic-engine', estimatedTime: '30 分钟', rewards: ['自动化客户', '流量系统'] },
  { id: 'first_customer', stepNumber: 6, title: '第一个客户', description: '转化你的第一个付费客户。', missionId: 'customer_acquisition', route: '/crm', estimatedTime: '30 分钟', rewards: ['收入', '案例', '信心'] },
  { id: 'follow_up_system', stepNumber: 7, title: '跟进系统', description: '自动化客户跟进。', missionId: 'customer_acquisition', route: '/whatsapp-ai', estimatedTime: '20 分钟', rewards: ['自动化', '一致性'] },
  { id: 'sales_engine', stepNumber: 10, title: '销售引擎', description: '建立可复制的销售流程。', missionId: 'customer_acquisition', route: '/crm', estimatedTime: '30 分钟', rewards: ['销售管道', '收入系统'] },
  { id: 'automation_engine', stepNumber: 11, title: '自动化引擎', description: '端到端自动化工作流程。', missionId: 'system_building', route: '/automation', estimatedTime: '40 分钟', rewards: ['可扩展性', '时间自由'] },
  { id: 'team_building', stepNumber: 12, title: '团队建设', description: '引入你的第一个团队成员。', missionId: 'team_scaling', route: '/team', estimatedTime: '60 分钟', rewards: ['团队成长', '授权分工'] },
  { id: 'leadership', stepNumber: 13, title: '领导力', description: '发展领导能力。', missionId: 'team_scaling', route: '/team', estimatedTime: '持续进行', rewards: ['领导技能', '导师能力'] },
  { id: 'scale', stepNumber: 14, title: '规模化', description: '规模化运营与收入。', missionId: 'team_scaling', route: '/analytics-center', estimatedTime: '持续进行', rewards: ['业务增长', '市场影响力'] },
  { id: 'business_operator', stepNumber: 15, title: '业务运营者', description: '运营一个自我维持的事业。', missionId: 'team_scaling', route: '/dashboard', estimatedTime: '持续进行', rewards: ['完整系统', '财务自由'] },
];

const TOTAL = STEPS.length;

// ─── Level-based lock rules ──────────────────────────────────────────────────

const LEVEL_STEP_BOUNDARY: Record<UserLevel, number> = {
  explorer: 3,   // steps 1-3
  builder: 5,     // steps 1-5
  operator: 10,   // steps 1-10
  leader: 15,     // steps 1-15
};

function getLockedReason(step: RoadmapStep, level: UserLevel, completed: string[]): string | null {
  if (step.stepNumber <= LEVEL_STEP_BOUNDARY[level]) return null;
  const prevLevel = step.stepNumber <= 5 ? 'Builder' : step.stepNumber <= 10 ? 'Operator' : 'Leader';
  return `🔒 Unlocks at ${prevLevel} Level`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getGrowthRoadmapState(input: {
  brandInterview?: boolean; brandDNA?: boolean; socialSetup?: boolean;
  leadCount?: number; customerCount?: number; contentCount?: number; teamMemberCount?: number;
  crmActive?: boolean; followUpActive?: boolean;
}): GrowthRoadmapState {
  const levelState = getUserLevel(input);
  const completed = levelState.completedMilestones;
  const completedSet = new Set(completed);

  // Map milestone IDs to step completion
  const milestoneToStep: Record<string, string[]> = {
    brand_interview_complete: ['brand_interview'],
    brand_dna_complete: ['brand_dna'],
    social_setup_complete: ['social_setup'],
    first_content_published: ['first_content'],
    three_contents_published: ['content_engine'],
    first_lead_generated: ['first_lead'],
    first_customer_acquired: ['first_customer'],
    crm_setup_complete: ['sales_engine'],
    followup_system_active: ['follow_up_system'],
    first_team_member: ['team_building'],
    automation_enabled: ['automation_engine'],
    team_dashboard_active: ['leadership'],
  };

  const completedStepIds = new Set<string>();
  for (const [ms, steps] of Object.entries(milestoneToStep)) {
    if (completedSet.has(ms)) steps.forEach(s => completedStepIds.add(s));
  }

  let currentFound = false;
  const steps: RoadmapStep[] = STEPS.map(def => {
    let status: RoadmapStepStatus;
    if (completedStepIds.has(def.id)) {
      status = 'completed';
    } else if (!currentFound) {
      status = 'current';
      currentFound = true;
    } else if (def.stepNumber <= LEVEL_STEP_BOUNDARY[levelState.level]) {
      status = 'unlocked';
    } else {
      status = 'locked';
    }
    return { ...def, status };
  });

  const currentStep = steps.find(s => s.status === 'current')!;
  const nextStep = steps.find(s => s.status === 'unlocked');
  const completedCount = steps.filter(s => s.status === 'completed').length;

  // Group by mission
  const missionMap = new Map<string, RoadmapStep[]>();
  for (const step of steps) {
    if (!missionMap.has(step.missionId)) missionMap.set(step.missionId, []);
    missionMap.get(step.missionId)!.push(step);
  }

  const missionGroups: RoadmapMissionGroup[] = [
    { missionId: 'brand_foundation', title: '品牌基础', description: '建立你的个人品牌基础。' },
    { missionId: 'content_creation', title: '内容创作', description: '发布你的第一篇内容。' },
    { missionId: 'lead_generation', title: '客户开发', description: '获得你的第一个潜在客户。' },
    { missionId: 'customer_acquisition', title: '客户获取', description: '获得你的第一个付费客户。' },
    { missionId: 'system_building', title: '系统建设', description: '创建可复制的系统。' },
    { missionId: 'team_scaling', title: '团队扩展', description: '超越个人能力，建立团队。' },
  ].map(m => {
    const groupSteps = missionMap.get(m.missionId) ?? [];
    const completedInGroup = groupSteps.filter(s => s.status === 'completed').length;
    return { ...m, steps: groupSteps, progressPercentage: groupSteps.length > 0 ? Math.round((completedInGroup / groupSteps.length) * 100) : 0, completed: completedInGroup === groupSteps.length };
  });

  return {
    currentStep,
    nextStep,
    steps,
    missionGroups,
    completedSteps: completedCount,
    totalSteps: TOTAL,
    progressPercentage: Math.round((completedCount / TOTAL) * 100),
  };
}

export function getRoadmapStepStatus(stepId: string, input: Parameters<typeof getGrowthRoadmapState>[0]): RoadmapStepStatus {
  const state = getGrowthRoadmapState(input);
  return state.steps.find(s => s.id === stepId)?.status ?? 'locked';
}
