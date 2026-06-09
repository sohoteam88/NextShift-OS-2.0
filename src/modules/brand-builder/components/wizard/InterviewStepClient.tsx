'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { InterviewModeSelector } from '../InterviewModeSelector';
import { TextInterview } from '../TextInterview';
import { VoiceInterview } from '../VoiceInterview';
type ExtractedProfile = Record<string, unknown>;

type Props = {
  existingInterviewId?: string;
};

export function InterviewStepClient({ existingInterviewId }: Props) {
  const router = useRouter();
  const [mode, setMode] = React.useState<'voice' | 'text' | null>(null);
  const [interviewId, setInterviewId] = React.useState<string | null>(existingInterviewId ?? null);
  const [creating, setCreating] = React.useState(false);

  async function handleSelectMode(selectedMode: 'voice' | 'text') {
    setCreating(true);
    try {
      const res = await fetch('/api/v1/brand-builder/interview', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create interview');
      const data = (await res.json()) as { data: { id: string } };
      setInterviewId(data.data.id);
      setMode(selectedMode);
    } catch {
      // fallback: still set mode
      setMode(selectedMode);
    } finally {
      setCreating(false);
    }
  }

  async function handleComplete(profile: ExtractedProfile) {
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'interview', interviewId }),
    });
    // Save profile to brand_profile
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    router.push('/brand-builder/step/profile');
  }

  if (!mode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">👋 欢迎来到品牌建设向导</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            AI 将通过 7 个步骤帮你建立专属的品牌系统。首先，让我们了解你的背景与目标。
          </p>
        </div>
        <InterviewModeSelector onSelect={handleSelectMode} loading={creating} />
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

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'interview' }),
    });
    router.push('/brand-builder/step/profile');
  }

  if (!interviewId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (mode === 'text') {
    return (
      <TextInterview
        interviewId={interviewId}
        onComplete={(profile) => void handleComplete(profile)}
      />
    );
  }

  return (
    <VoiceInterview
      interviewId={interviewId}
      onSwitchToText={() => setMode('text')}
      onComplete={(profile) => void handleComplete(profile)}
    />
  );
}
