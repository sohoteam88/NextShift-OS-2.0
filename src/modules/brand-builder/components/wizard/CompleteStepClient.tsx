'use client';

import { useRouter } from 'next/navigation';

type Props = { userName: string };

export function CompleteStepClient({ userName }: Props) {
  const router = useRouter();

  async function handleFinish() {
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'complete' }),
    });
    // Also mark onboarding brand step as completed
    await fetch('/api/v1/member/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'brand' }),
    }).catch(() => null);
    router.push('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-10 text-center">
      <div className="space-y-3">
        <div className="text-7xl">🎉</div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          {userName}，你的 Brand DNA 已就绪！
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          AI 已了解你的定位、社交资料和平台方向。回到 AI COO 后，系统会判断下一步是否该生成内容计划。
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          type="button"
          onClick={() => void handleFinish()}
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          回到 AI COO →
        </button>
      </div>
    </div>
  );
}
