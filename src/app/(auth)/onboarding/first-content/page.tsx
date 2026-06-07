'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/stores/toast-store';

type FirstContentOption = {
  title: string;
  hook: string;
  content: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'xiaohongshu';
};

type OnboardingOverview = {
  first_content_options: FirstContentOption[];
  state: { completed: boolean };
};

const PLATFORMS: FirstContentOption['platform'][] = ['facebook', 'instagram', 'tiktok', 'xiaohongshu'];

export default function OnboardingFirstContentPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { toast } = useToast();
  const [options, setOptions] = React.useState<FirstContentOption[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [hook, setHook] = React.useState('');
  const [content, setContent] = React.useState('');
  const [platform, setPlatform] = React.useState<FirstContentOption['platform']>('facebook');

  const overviewQuery = useQuery({
    queryKey: ['member-onboarding-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/onboarding');
      if (!res.ok) throw new Error('Failed to load onboarding data');
      return res.json() as Promise<{ data: OnboardingOverview }>;
    },
  });

  const applyOption = React.useCallback((option: FirstContentOption) => {
    setTitle(option.title);
    setHook(option.hook);
    setContent(option.content);
    setPlatform(option.platform);
  }, []);

  React.useEffect(() => {
    const next = overviewQuery.data?.data.first_content_options ?? [];
    setOptions(next);
    const first = next[0];
    if (first) {
      setSelectedIndex(0);
      applyOption(first);
    }
  }, [overviewQuery.data?.data.first_content_options, applyOption]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/onboarding/first-content', { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to generate content ideas');
      }
      return res.json() as Promise<{ data: FirstContentOption[] }>;
    },
    onSuccess: (response) => {
      const next = response.data;
      setOptions(next);
      setSelectedIndex(0);
      if (next[0]) applyOption(next[0]);
      toast('success', t('contentIdeasGenerated'));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/onboarding/first-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          platform,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save content');
      }
      return res.json() as Promise<{ data: unknown }>;
    },
    onSuccess: () => {
      toast('success', t('contentSaved'));
      router.push('/onboarding/first-funnel');
    },
  });

  if (overviewQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('firstContentTitle')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('firstContentHelp')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          {t('generateIdeas')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('chooseOne')}</p>
          {options.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-text-muted)]">
              {t('generateIdeas')}
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((option, index) => {
                const active = index === selectedIndex;
                return (
                  <button
                    key={`${option.title}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(index);
                      applyOption(option);
                    }}
                    className={`w-full rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
                      active
                        ? 'border-[var(--color-primary)] bg-blue-50'
                        : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{option.title}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{option.hook}</p>
                      </div>
                      <Badge variant="info">{option.platform}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Input label={t('ideaTitle')} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label={t('ideaHook')} value={hook} onChange={(e) => setHook(e.target.value)} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">{t('platform')}</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPlatform(item)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    platform === item
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text)]">{t('ideaContent')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm leading-6 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              loading={saveMutation.isPending}
              disabled={!title.trim() || !content.trim()}
              onClick={() => saveMutation.mutate()}
            >
              {t('saveContent')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
