import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface BrandBuilderState {
  current_step: number;
  completed_steps: string[];
  interview_id?: string;
  started_at: string;
  completed_at?: string;
}

export const WIZARD_STEPS = [
  { id: 'interview', name: '了解你', path: '/brand-builder/step/interview' },
  { id: 'profile', name: '品牌画像', path: '/brand-builder/step/profile' },
  { id: 'accounts', name: '账号设置', path: '/brand-builder/step/accounts' },
  { id: 'platform_guide', name: '平台指引', path: '/brand-builder/step/guides' },
  { id: 'content_strategy', name: '内容策略', path: '/brand-builder/step/strategy' },
  { id: 'content_calendar', name: '内容日历', path: '/brand-builder/step/calendar' },
  { id: 'complete', name: '完成', path: '/brand-builder/step/complete' },
];

export async function getWizardState(userId: string): Promise<BrandBuilderState> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const state = meta.brand_builder_state as BrandBuilderState | undefined;
  if (!state) {
    return {
      current_step: 1,
      completed_steps: [],
      started_at: new Date().toISOString(),
    };
  }
  return state;
}

export async function saveWizardState(
  userId: string,
  updates: Partial<BrandBuilderState>,
): Promise<BrandBuilderState> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const current = (meta.brand_builder_state as BrandBuilderState | undefined) ?? {
    current_step: 1,
    completed_steps: [],
    started_at: new Date().toISOString(),
  };
  const newState: BrandBuilderState = { ...current, ...updates };
  const newMeta = { ...meta, brand_builder_state: newState };
  await prisma.user.update({
    where: { id: userId },
    data: { metadata: newMeta as unknown as Prisma.InputJsonValue },
  });
  return newState;
}

export async function completeWizardStep(userId: string, stepId: string): Promise<BrandBuilderState> {
  const stepIdx = WIZARD_STEPS.findIndex((s) => s.id === stepId);
  if (stepIdx === -1) throw new Error('Invalid step');

  const current = await getWizardState(userId);
  const completedSteps = Array.from(new Set([...current.completed_steps, stepId]));
  const nextStepNum = stepIdx + 2; // 1-indexed next step
  const isLast = stepId === 'complete';

  return saveWizardState(userId, {
    completed_steps: completedSteps,
    current_step: isLast ? WIZARD_STEPS.length : Math.max(current.current_step, nextStepNum),
    completed_at: isLast ? new Date().toISOString() : current.completed_at,
  });
}

export function getCurrentStepPath(state: BrandBuilderState): string {
  const idx = Math.min(state.current_step - 1, WIZARD_STEPS.length - 1);
  return WIZARD_STEPS[idx].path;
}

export function isWizardComplete(state: BrandBuilderState): boolean {
  return !!state.completed_at;
}
