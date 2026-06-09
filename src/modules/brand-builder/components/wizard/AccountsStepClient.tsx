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

  async function handleSave(updates: Record<string, unknown>) {
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
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
        <h1 className="text-2xl font-bold text-[var(--color-text)]">🔧 账号设置</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          AI 将根据你的品牌定位生成账号名称和简介建议。
        </p>
      </div>
      <AccountSetupStep
        brandProfile={brandProfile}
        onSave={(updates) => void handleSave(updates)}
      />
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => void handleContinue()}
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          {saved ? '继续下一步 →' : '保存并继续 →'}
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
