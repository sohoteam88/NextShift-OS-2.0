'use client';

import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BrandProfileStep } from '../BrandProfileStep';

type Props = {
  initialProfile: Record<string, unknown>;
  interviewId?: string;
};

export function ProfileStepClient({ initialProfile, interviewId }: Props) {
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);

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

  async function handleRestartInterview() {
    setRestarting(true);
    try {
      await fetch('/api/v1/brand-builder/wizard/restart-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      router.push('/brand-builder/step/interview');
      router.refresh();
    } finally {
      setRestarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">🎯 品牌画像</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            根据面试内容，AI 已为你生成品牌定位。请确认或调整。
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => void handleRestartInterview()}
          loading={restarting}
        >
          重新跟 AI 聊一次
        </Button>
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
