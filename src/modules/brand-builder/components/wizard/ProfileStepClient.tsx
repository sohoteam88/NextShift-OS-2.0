'use client';

import { useRouter } from 'next/navigation';
import { BrandProfileStep } from '../BrandProfileStep';

type Props = {
  initialProfile: Record<string, unknown>;
  interviewId?: string;
};

export function ProfileStepClient({ initialProfile, interviewId }: Props) {
  const router = useRouter();

  async function handleComplete(profile: Record<string, unknown>) {
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'profile' }),
    });
    router.push('/brand-builder/step/accounts');
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'profile' }),
    });
    router.push('/brand-builder/step/accounts');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">🎯 品牌画像</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          根据面试内容，AI 已为你生成品牌定位。请确认或调整。
        </p>
      </div>
      <BrandProfileStep
        initialProfile={initialProfile}
        interviewId={interviewId}
        onComplete={(profile) => void handleComplete(profile)}
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
