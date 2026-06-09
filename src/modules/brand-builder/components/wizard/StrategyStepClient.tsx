'use client';

import { useRouter } from 'next/navigation';
import { ContentStrategyStep } from '../ContentStrategyStep';

type Pillar = { name: string; emoji: string; pct: number };

type Props = {
  brandProfile: Record<string, unknown>;
};

export function StrategyStepClient({ brandProfile }: Props) {
  const router = useRouter();

  async function handleComplete({
    contentPillars,
    contentStrategy,
  }: {
    contentPillars: Pillar[];
    contentStrategy: Record<string, unknown>;
  }) {
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentPillars, contentStrategy }),
    });
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'content_strategy' }),
    });
    router.push('/brand-builder/step/calendar');
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'content_strategy' }),
    });
    router.push('/brand-builder/step/calendar');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">📊 内容策略</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          设定你的内容支柱、发布频率和风格。AI 将根据策略生成 30 天内容日历。
        </p>
      </div>
      <ContentStrategyStep
        brandProfile={brandProfile}
        onComplete={(strategy) => void handleComplete(strategy)}
      />
      <button
        type="button"
        onClick={() => void handleSkip()}
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        跳过此步骤 →
      </button>
    </div>
  );
}
