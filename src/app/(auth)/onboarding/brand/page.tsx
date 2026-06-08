'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/stores/toast-store';

type BrandPositioning = {
  positioning: string;
  content_pillars: string[];
  audience?: string;
  why_this_works?: string;
};

type OnboardingOverview = {
  brand_positioning: BrandPositioning | null;
  state: { completed: boolean };
};

export default function OnboardingBrandPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { toast } = useToast();
  const [positioning, setPositioning] = React.useState('');
  const [pillars, setPillars] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [whyThisWorks, setWhyThisWorks] = React.useState('');

  const overviewQuery = useQuery({
    queryKey: ['member-onboarding-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/onboarding');
      if (!res.ok) throw new Error('Failed to load onboarding data');
      return res.json() as Promise<{ data: OnboardingOverview }>;
    },
  });

  const populateFromBrand = React.useCallback((brand: BrandPositioning | null) => {
    if (!brand) return;
    setPositioning(brand.positioning || '');
    setPillars((brand.content_pillars ?? []).join(', '));
    setAudience(brand.audience || '');
    setWhyThisWorks(brand.why_this_works || '');
  }, []);

  React.useEffect(() => {
    populateFromBrand(overviewQuery.data?.data.brand_positioning ?? null);
  }, [overviewQuery.data?.data.brand_positioning, populateFromBrand]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/onboarding/brand', { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to generate brand positioning');
      }
      return res.json() as Promise<{ data: BrandPositioning }>;
    },
    onSuccess: (response) => {
      populateFromBrand(response.data);
      toast('success', t('brandGenerated'));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/onboarding/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positioning,
          content_pillars: pillars
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          audience: audience || undefined,
          why_this_works: whyThisWorks || undefined,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save brand positioning');
      }
      return res.json() as Promise<{ data: unknown }>;
    },
    onSuccess: () => {
      toast('success', t('brandSaved'));
      router.push('/onboarding/first-content');
    },
  });

  if (overviewQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('brandTitle')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('brandHelp')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={<Sparkles className="h-4 w-4" />}
          loading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          {overviewQuery.data?.data.brand_positioning ? t('regenerateBrand') : t('generateBrand')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Input label={t('positioning')} value={positioning} onChange={(e) => setPositioning(e.target.value)} />

          <Input
            label={t('contentPillars')}
            value={pillars}
            onChange={(e) => setPillars(e.target.value)}
            placeholder="实用知识, 真实案例, 行动建议"
          />

          <Input label={t('audience')} value={audience} onChange={(e) => setAudience(e.target.value)} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text)]">{t('whyThisWorks')}</label>
            <textarea
              value={whyThisWorks}
              onChange={(e) => setWhyThisWorks(e.target.value)}
              rows={6}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('brandTitle')}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {positioning || overviewQuery.data?.data.brand_positioning?.positioning || t('brandHelp')}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('contentPillars')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(pillars ? pillars.split(',') : overviewQuery.data?.data.brand_positioning?.content_pillars ?? []).map((pillar) => (
                <span
                  key={pillar}
                  className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-text)]"
                >
                  {pillar.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
            <p>
              <span className="font-medium text-[var(--color-text)]">{t('audience')}:</span> {audience || '—'}
            </p>
            <p className="whitespace-pre-wrap">
              <span className="font-medium text-[var(--color-text)]">{t('whyThisWorks')}:</span> {whyThisWorks || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          loading={saveMutation.isPending}
          disabled={!positioning.trim() || pillars.trim().length === 0}
          onClick={() => saveMutation.mutate()}
        >
          {t('acceptBrand')}
        </Button>
      </div>
    </div>
  );
}
