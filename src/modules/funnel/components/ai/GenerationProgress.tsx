import { Loader2 } from 'lucide-react';

export function GenerationProgress({ stage }: { stage: 'idle' | 'strategy' | 'content' }) {
  if (stage === 'idle') return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[var(--color-primary)]" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">正在生成漏斗系统</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {stage === 'strategy'
              ? 'Stage 1：AI 正在制定漏斗类型、核心叙事、最大风险和跟进天数。'
              : 'Stage 2：AI 正在用已确认的策略生成落地页、WhatsApp、广告角度、Hooks 和异议处理。'}
          </p>
        </div>
      </div>
    </div>
  );
}
