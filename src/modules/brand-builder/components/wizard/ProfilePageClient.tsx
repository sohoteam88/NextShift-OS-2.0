'use client';

import { useRouter } from 'next/navigation';
import { BrandProfileStep } from '../BrandProfileStep';
import { useToast } from '@/stores/toast-store';

type Props = {
  initialProfile: Record<string, unknown>;
};

export function ProfilePageClient({ initialProfile }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleComplete(profile: Record<string, unknown>) {
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    toast('success', '品牌画像已保存');
    router.push('/brand-builder/calendar');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">品牌画像</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          查看和编辑你的品牌定位、受众群体和内容策略。
        </p>
      </div>
      <BrandProfileStep
        initialProfile={initialProfile}
        onComplete={(profile) => void handleComplete(profile)}
      />
    </div>
  );
}
