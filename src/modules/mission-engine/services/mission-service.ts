// Mission Service — mission-driven operating layer
// Maps user level + milestones to the current mission

import type { Mission, MissionTask } from '../types/mission.types';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';

interface MissionInput {
  level: UserLevel;
  brandInterview?: boolean;
  brandDNA?: boolean;
  socialSetup?: boolean;
  hasContent?: boolean;
  hasLead?: boolean;
  hasCustomer?: boolean;
  teamMemberCount?: number;
}

const MISSIONS: Record<string, Omit<Mission, 'tasks' | 'completed'>> = {
  brand_foundation: {
    id: 'brand_foundation', stage: 'brand_foundation',
    title: '品牌基础', description: '建立你的个人品牌基础。',
    objective: '建立清晰的品牌身份，让 AI 可以为你创建个性化内容。',
    rewards: ['品牌定位', '内容方向', 'AI 个性化'],
    estimatedTime: '15 分钟', nextMission: 'content_creation',
  },
  content_creation: {
    id: 'content_creation', stage: 'content_creation',
    title: '内容创作', description: '发布你的第一篇内容。',
    objective: '让你的第一篇内容发布出去，开始建立你的影响力。',
    rewards: ['受众可见度', '潜在客户准备'],
    estimatedTime: '10 分钟', nextMission: 'lead_generation',
  },
  lead_generation: {
    id: 'lead_generation', stage: 'lead_generation',
    title: '潜在客户开发', description: '获得你的第一个潜在客户。',
    objective: '建立一个能吸引潜在客户的引流系统。',
    rewards: ['潜在客户管道', '受众列表'],
    estimatedTime: '20 分钟', nextMission: 'customer_acquisition',
  },
  customer_acquisition: {
    id: 'customer_acquisition', stage: 'customer_acquisition',
    title: '客户获取', description: '获得你的第一个付费客户。',
    objective: '将潜在客户转化为付费客户。',
    rewards: ['收入', '案例研究', '信心'],
    estimatedTime: '30 分钟', nextMission: 'system_building',
  },
  system_building: {
    id: 'system_building', stage: 'system_building',
    title: '系统建设', description: '创建可复制的系统。',
    objective: '建立自动化和工作流程，让你不在场也能运转。',
    rewards: ['可扩展性', '时间自由'],
    estimatedTime: '40 分钟', nextMission: 'team_scaling',
  },
  team_scaling: {
    id: 'team_scaling', stage: 'team_scaling',
    title: '团队扩展', description: '超越个人能力，建立团队。',
    objective: '招募并领导团队，放大你的影响力。',
    rewards: ['团队成长', '业务扩展'],
    estimatedTime: '60 分钟',
  },
};

const TASK_MAP: Record<string, MissionTask[]> = {
  brand_foundation: [
    { key: 'brand_interview', label: '品牌访谈', route: '/brand-builder/step/interview', completed: false },
    { key: 'brand_dna', label: '品牌 DNA', route: '/brand-builder/step/profile', completed: false },
    { key: 'social_setup', label: '社交资料设置', route: '/brand-builder/step/accounts', completed: false },
  ],
  content_creation: [
    { key: 'first_content', label: '内容规划', route: '/content-engine', completed: false },
    { key: 'content_generated', label: '内容生成', route: '/content-engine', completed: false },
    { key: 'content_published', label: '内容发布', route: '/content-engine', completed: false },
  ],
  lead_generation: [
    { key: 'lead_magnet', label: '引流磁铁', route: '/lead-magnet', completed: false },
    { key: 'landing_page', label: '着陆页', route: '/funnel', completed: false },
    { key: 'lead_capture', label: '客户获取', route: '/traffic-engine', completed: false },
  ],
  customer_acquisition: [
    { key: 'crm_setup', label: 'CRM 设置', route: '/crm', completed: false },
    { key: 'follow_up', label: '客户跟进', route: '/whatsapp-ai', completed: false },
    { key: 'sales_conversation', label: '销售对话', route: '/crm', completed: false },
  ],
  system_building: [
    { key: 'automation', label: '自动化', route: '/automation', completed: false },
    { key: 'workflow', label: '工作流程', route: '/automation', completed: false },
    { key: 'ai_assistants', label: 'AI 助手', route: '/ai-workforce', completed: false },
  ],
  team_scaling: [
    { key: 'recruitment', label: '招募成员', route: '/ai-workforce', completed: false },
    { key: 'team_management', label: '团队管理', route: '/ai-workforce', completed: false },
    { key: 'leadership', label: '领导力', route: '/ai-workforce', completed: false },
  ],
};

function determineStage(input: MissionInput): Mission['stage'] {
  if (!input.brandInterview || !input.brandDNA || !input.socialSetup) return 'brand_foundation';
  if (!input.hasContent) return 'content_creation';
  if (!input.hasLead) return 'lead_generation';
  if (!input.hasCustomer) return 'customer_acquisition';
  if ((input.teamMemberCount ?? 0) < 1) return 'system_building';
  return 'team_scaling';
}

export function getCurrentMission(input: MissionInput): Mission {
  const stage = determineStage(input);
  const def = MISSIONS[stage];
  const tasks = (TASK_MAP[stage] ?? []).map(t => ({
    ...t,
    completed: input.brandInterview ? (t.key === 'brand_interview') :
               input.brandDNA ? ['brand_interview', 'brand_dna'].includes(t.key) :
               input.socialSetup ? ['brand_interview', 'brand_dna', 'social_setup'].includes(t.key) :
               false,
  }));

  const completedCount = tasks.filter(t => t.completed).length;
  const allComplete = completedCount === tasks.length;

  return {
    ...def,
    tasks,
    completed: allComplete,
  };
}

export function getMissionTasks(stage: Mission['stage']): MissionTask[] {
  return TASK_MAP[stage] ?? [];
}
