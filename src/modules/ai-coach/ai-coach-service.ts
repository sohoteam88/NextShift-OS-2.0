// AI Coach V2 — Mission-aware coaching engine
// Replaces role-based personas with mission-context-aware advice

import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';
import type { WorkspaceContext } from '@/modules/workspace/types';

interface CoachContext {
  missionTitle: string;
  missionObjective: string;
  level: UserLevel;
  progressPct: number;
  nextTask: string;
  completedTasks: string[];
}

interface CoachAdvice {
  why: string;
  outcome: string;
  mistake: string;
  nextBestAction: string;
  encouragement: string;
}

const ADVICE: Record<string, CoachAdvice> = {
  brand_foundation: {
    why: '在 AI 为你创建内容之前，它需要先了解你的故事、你的受众以及你独特的定位。',
    outcome: '你将拥有完整的个人品牌基础：清晰的定位、明确的受众，以及用你的语气写作的 AI。',
    mistake: '常见错误：跳过品牌 DNA 直接去创作内容。这会导致内容听起来不像你自己，显得很泛泛。',
    nextBestAction: '完成你的品牌访谈——只需 10 分钟，就能解锁后续所有功能。',
    encouragement: '大多数成功的个人品牌都在这一个步骤上花时间。你正在为接下来的一切建立基础。',
  },
  content_creation: {
    why: '内容是别人发现你的方式。没有内容，你在线上是隐形的。',
    outcome: '你发布的第一篇内容将开始吸引关注并建立你的受众。',
    mistake: '常见错误：等待完美。你的第一篇内容不需要完美——它只需要发布出去。',
    nextBestAction: '使用内容引擎生成你的第一篇帖子。AI 会根据你的品牌 DNA 来创建。',
    encouragement: '每一位成功的创作者都是从第一篇帖子开始的。你离加入他们只差一次点击。',
  },
  lead_generation: {
    why: '内容创造关注。引流磁铁将关注转化为关系。',
    outcome: '你将拥有一个可以将访客转化为联系人的引流系统。',
    mistake: '常见错误：创作了内容但没有捕获潜在客户的方法。每一篇内容都应该有下一步行动。',
    nextBestAction: '创建你的第一个引流磁铁——一个解决具体问题的简单免费资源。',
    encouragement: '第一个潜在客户是最难的。之后，你就有了一个可以持续运作的系统。',
  },
  customer_acquisition: {
    why: '潜在客户是可能性。客户是证明。转化第一个客户验证了一切。',
    outcome: '你的第一个客户证明你的系统有效，并为你提供了一个真实的案例。',
    mistake: '常见错误：跟进一次就放弃了。大多数成交发生在 3-5 次接触之后。',
    nextBestAction: '设置你的 CRM，今天就发出第一条跟进消息。',
    encouragement: '你已经有了潜在客户。现在需要的是持续跟进的纪律。',
  },
  system_building: {
    why: '你已经证明了自己能销售。现在你需要的是不需要你亲力亲为的系统。',
    outcome: '自动化工作流程释放你的时间，让你能专注于策略和团队建设等更高价值的工作。',
    mistake: '常见错误：试图一次性自动化所有东西。先从一个工作流程开始，让它稳定运行，然后再加新的。',
    nextBestAction: '设置你的第一个自动化跟进序列。',
    encouragement: '你已经建立了一个能运作的业务。系统会把它带到一个新的高度。',
  },
  team_scaling: {
    why: '你的时间有限。建立团队能成倍放大你的影响力，创造真正的商业价值。',
    outcome: '团队让你能服务更多客户、创作更多内容，建立一家真正的公司。',
    mistake: '常见错误：在系统准备好之前就招人。先建立系统，再为系统招募人才。',
    nextBestAction: '创建你的第一份团队邀请，确定你想带谁一起上路。',
    encouragement: '你已经建立了一个值得复制的体系。现在建立团队来规模化运作。',
  },
};

const DEFAULT_ADVICE: CoachAdvice = {
  why: '旅程中的每一步都建立在前一步的基础上。保持一致，持续前进。',
  outcome: '完成这个任务会让你离一个完全自主运营的事业更近一步。',
  mistake: '常见错误：试图同时做所有事情。一次只专注一个任务。',
  nextBestAction: '继续你当前的任务，完成下一步行动。',
  encouragement: '进步胜过完美。继续向前迈进。',
};

export function getAICoachAdvice(missionId: string, workspaceContext?: WorkspaceContext): CoachAdvice {
  const advice = ADVICE[missionId] ?? DEFAULT_ADVICE;
  const coachingFocus = workspaceContext?.aiContext.focus[0];

  if (!coachingFocus) {
    return advice;
  }

  return {
    ...advice,
    nextBestAction: `${advice.nextBestAction} Focus: ${coachingFocus}.`,
  };
}

export function getNextBestAction(missionId: string, completedTasks: string[], workspaceContext?: WorkspaceContext): string {
  const advice = getAICoachAdvice(missionId, workspaceContext);
  const remaining = completedTasks.length === 0 ? 'Start your first task.' : `${completedTasks.length} tasks completed. ${advice.nextBestAction}`;
  return remaining;
}
