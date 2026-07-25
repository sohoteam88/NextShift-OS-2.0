import { getBusinessPackSlice } from '@/modules/ai/business-pack';
import { enforceComplianceHardFilter } from '@/modules/ai/compliance';
import { buildGenerationContext, runGeneration } from '@/modules/ai/generation';
import { GENERATION_DEGRADE_LABEL } from '@/modules/ai/generation/types';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import {
  generationTrackForState,
  getSelectedOption,
  getTopic,
  type ForkedInterviewState,
} from './funnelDefinition';

const STRICT_B_PATH_PATTERN = /(?:收入|赚钱|赚[钱取]|月入|日入|薪水|财务自由|回本|保证|包赚|稳赚)/i;
const BRAND_LEAK_PATTERN = /(?:\bherbalife\b|贺宝芙|康宝莱|\bformula\s*1\b|\bn-?r-?g\b|\baloe\s+concentrate\b)/i;

export type FunnelConfirmationResult =
  | { status: 'success'; sentence: string }
  | { status: 'degraded'; userVisibleLabel: typeof GENERATION_DEGRADE_LABEL; reason: string }
  | { status: 'rejected'; reason: string };

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/^['“”\s]+|['“”\s]+$/g, '').trim();
}

/**
 * Applies G4 to every confirmation sentence and adds the one-pager's stronger
 * B-path guard: opportunity stories cannot turn into income-promise copy.
 */
export function filterFunnelConfirmation(sentence: string, state: ForkedInterviewState): FunnelConfirmationResult {
  const track = generationTrackForState(state);
  const verdict = enforceComplianceHardFilter({
    track,
    fields: { title: '', hook: '', body: sentence, cta: '', hashtags: [] },
  });
  if (verdict.status === 'rejected') {
    return { status: 'rejected', reason: verdict.violations.map((violation) => violation.code).join(', ') };
  }
  const filtered = normalizeSentence(verdict.fields.body);
  if (!filtered || BRAND_LEAK_PATTERN.test(filtered)) {
    return { status: 'rejected', reason: 'brand_residual' };
  }
  if (state.entryPath === 'B' && STRICT_B_PATH_PATTERN.test(filtered)) {
    return { status: 'rejected', reason: 'b_path_strict_compliance' };
  }
  return { status: 'success', sentence: filtered };
}

export async function generateFunnelConfirmation(
  user: Pick<AuthUser, 'id' | 'tenantId'>,
  state: ForkedInterviewState,
): Promise<FunnelConfirmationResult> {
  const topic = getTopic(state);
  const selected = getSelectedOption(topic, state.topics[topic.id]);
  if (!selected) throw new Error('Choose an option before generating confirmation');

  const track = generationTrackForState(state);
  const context = await buildGenerationContext(user, {
    mode: track,
    platform: 'facebook',
    businessPack: getBusinessPackSlice({ track, platform: 'facebook' }),
  });
  const outcome = await runGeneration(user, {
    context,
    taskCategory: 'interview_analysis',
    feature: 'brand_forked_interview_confirmation',
    // The gateway requires a fallback value. Empty is deliberately never shown
    // or stored, preserving G5's explicit retry contract rather than faking AI.
    fallback: '',
    temperature: 0.35,
    maxTokens: 160,
    userMessage: [
      '你是品牌访谈整理员。只写一句第一人称、可由用户确认的中文故事，不得添加未提供的事实、数字、品牌名、产品商标、收入承诺、医疗或保证效果。',
      `主题：${topic.label}`,
      `选择：${selected.label}`,
      `事实碎片：${state.topics[topic.id]?.facts.join('；') || '用户选择跳过补充'}`,
      state.entryPath === 'B' ? 'B 路径：只写真实过程与动机，严禁任何收入、赚钱、回本或财务自由表达。' : '',
      '只输出这一句，不加引号、标题或解释。',
    ].filter(Boolean).join('\n'),
  });

  if (outcome.status === 'degraded') {
    return { status: 'degraded', userVisibleLabel: outcome.userVisibleLabel, reason: outcome.reason };
  }
  return filterFunnelConfirmation(outcome.value, state);
}
