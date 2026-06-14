import type { FunnelBuilderInput } from '@/modules/ai/services/funnel-builder-service';
import type { StrategyContext } from '@/modules/funnel/types/strategy-context';
import type { GenerateResult, SavedFunnelRow } from '../types/funnel-builder';

export async function generateFunnel(input: FunnelBuilderInput): Promise<GenerateResult> {
  const res = await fetch('/api/v1/ai/generate/world-class-funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: { message?: string } };
    throw new Error(err.error?.message ?? err.message ?? '生成失败，请重试');
  }
  const json = await res.json() as { data: GenerateResult };
  return json.data;
}

export async function buildStrategy(input: {
  business: StrategyContext['business'];
  real_material: StrategyContext['real_material'];
}): Promise<StrategyContext> {
  const res = await fetch('/api/v1/ai/funnel-builder/build-strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: { message?: string } };
    throw new Error(err.error?.message ?? err.message ?? '策略生成失败，请重试');
  }
  const json = await res.json() as { data: StrategyContext };
  return json.data;
}

export async function fetchSavedFunnels(): Promise<SavedFunnelRow[]> {
  const res = await fetch('/api/v1/funnel/funnels?limit=20');
  if (!res.ok) return [];
  const json = await res.json() as { data: SavedFunnelRow[] };
  return json.data.filter((item) => item.config?.ai_generated?.source === 'world_class_funnel_builder');
}
