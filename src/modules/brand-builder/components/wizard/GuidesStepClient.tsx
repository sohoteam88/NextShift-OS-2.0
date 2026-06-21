'use client';

import { useRouter } from 'next/navigation';
import { PlatformGuideStep } from '../PlatformGuideStep';

type Props = {
  brandProfile: Record<string, unknown>;
  platforms: string[];
  phone: string;
  funnelUrl: string;
};

export function GuidesStepClient({ brandProfile, platforms, phone, funnelUrl }: Props) {
  const router = useRouter();

  async function handleComplete() {
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'platform_guide' }),
    });
    router.push('/brand-builder/step/complete');
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'platform_guide' }),
    });
    router.push('/brand-builder/step/complete');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">🗺️ 平台设置指引</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          按照步骤完成各平台的账号优化，打好引流基础。
        </p>
      </div>
      <PlatformGuideStep
        brandProfile={brandProfile}
        platforms={platforms}
        phone={phone}
        funnelUrl={funnelUrl}
        onComplete={() => void handleComplete()}
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
