'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw } from 'lucide-react';
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
    router.push('/dashboard');
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'profile' }),
    });
    router.push('/dashboard');
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
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/brand-builder/step/interview')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          回到 AI 访谈
        </button>
        <Button
          type="button"
          variant="secondary"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => void handleRestartInterview()}
          loading={restarting}
        >
          回到访谈补充
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
        className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        暂时跳过，先进入 AI COO →
      </button>
    </div>
  );
}
