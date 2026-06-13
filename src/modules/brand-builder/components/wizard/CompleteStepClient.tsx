'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    await fetch('/api/v1/member/onboarding/complete-step', {
      method: 'POST',
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
          {userName}，你的品牌系统已就绪！
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          你已完成品牌建设的所有关键步骤。现在就开始执行，建立你的引流品牌！
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/brand-builder/calendar"
            className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:border-[var(--color-primary)] hover:bg-blue-50"
          >
            <span className="text-2xl">📅</span>
            <span className="mt-1.5 text-xs font-medium text-[var(--color-text)]">查看内容日历</span>
          </Link>
          <Link
            href="/ai"
            className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:border-[var(--color-primary)] hover:bg-blue-50"
          >
            <span className="text-2xl">✍️</span>
            <span className="mt-1.5 text-xs font-medium text-[var(--color-text)]">开始创作内容</span>
          </Link>
          <Link
            href="/video/new"
            className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:border-[var(--color-primary)] hover:bg-blue-50"
          >
            <span className="text-2xl">🎬</span>
            <span className="mt-1.5 text-xs font-medium text-[var(--color-text)]">生成视频脚本</span>
          </Link>
          <Link
            href="/crm"
            className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:border-[var(--color-primary)] hover:bg-blue-50"
          >
            <span className="text-2xl">👥</span>
            <span className="mt-1.5 text-xs font-medium text-[var(--color-text)]">管理客户</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => void handleFinish()}
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          进入控制台 →
        </button>
      </div>
    </div>
  );
}
