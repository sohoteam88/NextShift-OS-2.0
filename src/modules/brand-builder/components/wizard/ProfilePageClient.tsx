'use client';

import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BrandProfileStep } from '../BrandProfileStep';
import { useToast } from '@/stores/toast-store';

type Props = {
  initialProfile: Record<string, unknown>;
};

export function ProfilePageClient({ initialProfile }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [restarting, setRestarting] = useState(false);

  async function handleComplete(profile: Record<string, unknown>) {
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    toast('success', '品牌画像已保存');
    router.push('/brand-builder/calendar');
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">品牌画像</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            查看和编辑你的品牌定位、受众群体和内容策略。
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
        onComplete={(profile) => void handleComplete(profile)}
      />
    </div>
  );
}
