'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AccountSetupStep } from '../AccountSetupStep';

type Props = {
  brandProfile: Record<string, unknown>;
};

export function AccountsStepClient({ brandProfile }: Props) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(false);

  function handleSave() {
    setSaved(true);
  }

  async function handleContinue() {
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'accounts' }),
    });
    router.push('/brand-builder/step/guides');
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'accounts' }),
    });
    router.push('/brand-builder/step/guides');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">社交资料设置</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          AI 将根据 Brand DNA 生成社交用户名、平台 Bio 和头像建议。这个步骤完成后，会继续进入平台指引；之后也可以在 Settings 回来修改。
        </p>
      </div>
      <AccountSetupStep
        brandProfile={brandProfile}
        onSave={handleSave}
      />
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!saved}
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? '继续平台指引 →' : '请先保存社交资料'}
        </button>
        <button
          type="button"
          onClick={() => void handleSkip()}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          跳过此步骤
        </button>
      </div>
    </div>
  );
}
