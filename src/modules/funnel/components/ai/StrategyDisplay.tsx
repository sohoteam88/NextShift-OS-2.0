import { Target } from 'lucide-react';
import type { StrategyContext } from '@/modules/funnel/types/strategy-context';
import { Field } from '../shared/Field';

export function StrategyDisplay({ context }: { context: StrategyContext }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5 text-[var(--color-primary)]" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">AI 漏斗策略</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="漏斗类型" value={`${context.strategy.funnel_type}｜${context.strategy.funnel_type_reason}`} />
        <Field label="主角度" value={`${context.strategy.primary_angle}｜${context.strategy.primary_angle_reason}`} />
        <Field label="核心叙事" value={context.strategy.core_narrative} />
        <Field label="最大风险与应对" value={`${context.strategy.biggest_risk} → ${context.strategy.risk_mitigation}`} />
      </div>
    </div>
  );
}
