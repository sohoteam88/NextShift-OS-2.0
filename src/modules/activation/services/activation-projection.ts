import type { ActivationProjection, ActivationStep, ActivationStepId } from '../contracts/ActivationProjection';
import { calculateActivationScore, completedActivationSteps, type ActivationFacts } from './activation-score-engine';
import { activationRiskFor, detectDropOffStage } from './dropoff-detector';
import {
  FIRST_WIN_TARGET_MINUTES,
  getFirstWinProgressPercent,
  getFirstWinStatus,
  getTimeToFirstWinMinutes,
} from './first-win-engine';

const ACTIVATION_THRESHOLD = 80;

const STEP_DEFINITIONS: Array<Omit<ActivationStep, 'status' | 'completedAt'>> = [
  { id: 'account_created', label: '账号已创建', route: '/dashboard', estimatedMinutes: 0 },
  { id: 'interview_started', label: '开始品牌访谈', route: '/brand-builder/step/interview', estimatedMinutes: 2 },
  { id: 'interview_completed', label: '完成品牌访谈', route: '/brand-builder/step/interview', estimatedMinutes: 8 },
  { id: 'brand_dna_generated', label: '生成品牌 DNA', route: '/brand-builder/profile', estimatedMinutes: 3 },
  { id: 'first_content_generated', label: '生成第一篇内容', route: '/content-engine', estimatedMinutes: 5 },
  { id: 'first_lead_captured', label: '获得第一位潜在客户', route: '/lead-magnet', estimatedMinutes: 10 },
];

function completedAtFor(step: ActivationStepId, facts: ActivationFacts) {
  const map: Record<ActivationStepId, Date | null> = {
    account_created: facts.userCreatedAt,
    interview_started: facts.interviewStartedAt,
    interview_completed: facts.interviewCompletedAt,
    brand_dna_generated: facts.brandDnaGeneratedAt,
    first_content_generated: facts.firstContentGeneratedAt,
    first_lead_captured: facts.firstLeadCapturedAt,
  };
  return map[step]?.toISOString() ?? null;
}

function buildSteps(facts: ActivationFacts): ActivationStep[] {
  const completed = completedActivationSteps(facts);
  const currentStep = STEP_DEFINITIONS.find((step) => !completed.has(step.id))?.id ?? 'first_lead_captured';

  return STEP_DEFINITIONS.map((step) => ({
    ...step,
    completedAt: completedAtFor(step.id, facts),
    status: completed.has(step.id)
      ? 'completed'
      : step.id === currentStep
        ? 'current'
        : 'locked',
  }));
}

function currentMissionFor(step: ActivationStep): ActivationProjection['currentMission'] {
  const descriptions: Record<ActivationStepId, string> = {
    account_created: '账号已经创建，下一步是开始品牌访谈。',
    interview_started: '用几分钟让 AI 了解你的故事、目标和受众。',
    interview_completed: '把访谈内容转换成清楚的品牌 DNA。',
    brand_dna_generated: '用品牌 DNA 生成第一篇可以发布的内容。',
    first_content_generated: '用第一篇内容连接到引流磁铁，开始收集潜在客户。',
    first_lead_captured: '你已经获得第一位潜在客户，可以进入跟进和转化。',
  };

  return {
    title: step.label,
    description: descriptions[step.id],
    route: step.route,
    ctaLabel: step.id === 'first_lead_captured' && step.status === 'completed' ? '查看潜在客户' : '继续激活',
    estimatedMinutes: step.estimatedMinutes,
  };
}

export function buildActivationProjection(facts: ActivationFacts): ActivationProjection {
  const activationScore = calculateActivationScore(facts);
  const steps = buildSteps(facts);
  const currentStep = steps.find((step) => step.status === 'current') ?? steps[steps.length - 1];
  const dropOffStage = detectDropOffStage(facts);
  const timeToFirstWinMinutes = getTimeToFirstWinMinutes(facts);
  const firstWinAchieved = timeToFirstWinMinutes !== null;
  const activationRisk = activationRiskFor({ facts, activationScore, dropOffStage });
  const interviewCompletionRate = facts.interviewStartedAt ? (facts.interviewCompletedAt ? 100 : 0) : 0;

  return {
    source: 'ActivationEngine',
    scope: 'user',
    confidence: activationScore > 10 ? 'derived' : 'fallback',
    fallback: activationScore > 10 ? 'none' : 'new_user_no_activation_signal',
    generatedAt: facts.generatedAt,
    activationScore,
    activationThreshold: ACTIVATION_THRESHOLD,
    activationRisk,
    dropOffStage,
    currentStep,
    steps,
    firstWin: {
      achieved: firstWinAchieved,
      targetMinutes: FIRST_WIN_TARGET_MINUTES,
      timeToFirstWinMinutes,
      progressPercent: getFirstWinProgressPercent(facts),
      status: getFirstWinStatus(facts),
    },
    currentMission: currentMissionFor(currentStep),
    shouldHideAdvancedModules: activationScore < ACTIVATION_THRESHOLD,
    kpis: {
      activationRate: activationScore >= ACTIVATION_THRESHOLD ? 100 : 0,
      interviewCompletionRate,
      timeToFirstWinMinutes,
      sevenDayRetentionSignal: Boolean(facts.lastActivityAt && (new Date(facts.generatedAt).getTime() - facts.userCreatedAt.getTime()) >= 7 * 86_400_000),
      thirtyDayRetentionSignal: Boolean(facts.lastActivityAt && (new Date(facts.generatedAt).getTime() - facts.userCreatedAt.getTime()) >= 30 * 86_400_000),
    },
  };
}
