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

type FunnelTemplate = {
  id: string;
  name: string;
  type: string;
  config: {
    sections?: Array<{ type?: string; headline?: string; title?: string }>;
  };
};

type OnboardingOverview = {
  profile: {
    phone: string;
    whatsapp: string;
  };
  first_funnel_id: string;
  first_funnel_template_id: string;
  state: { completed: boolean };
};

export default function OnboardingFirstFunnelPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');

  const overviewQuery = useQuery({
    queryKey: ['member-onboarding-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/onboarding');
      if (!res.ok) throw new Error('Failed to load onboarding data');
      return res.json() as Promise<{ data: OnboardingOverview }>;
    },
  });

  const templatesQuery = useQuery({
    queryKey: ['member-funnel-templates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/funnel/templates');
      if (!res.ok) throw new Error('Failed to load funnel templates');
      return res.json() as Promise<{ data: FunnelTemplate[] }>;
    },
  });

  React.useEffect(() => {
    const templates = templatesQuery.data?.data ?? [];
    const preferred = overviewQuery.data?.data.first_funnel_template_id;
    const nextTemplate = templates.find((template) => template.id === preferred) ?? templates[0];
    if (nextTemplate) {
      setSelectedTemplateId(nextTemplate.id);
    }
  }, [overviewQuery.data?.data.first_funnel_template_id, templatesQuery.data?.data]);

  React.useEffect(() => {
    const profile = overviewQuery.data?.data.profile;
    if (!profile) return;
    setWhatsapp(profile.whatsapp || profile.phone || '');
  }, [overviewQuery.data?.data.profile]);

  const selectedTemplate = React.useMemo(
    () => templatesQuery.data?.data.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templatesQuery.data?.data],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/onboarding/first-funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          whatsapp,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to create funnel');
      }
      return res.json() as Promise<{ data: unknown }>;
    },
    onSuccess: () => {
      toast('success', t('funnelCreated'));
      router.push('/onboarding/complete');
    },
  });

  if (overviewQuery.isLoading || templatesQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  const templates = templatesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('firstFunnelTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('firstFunnelHelp')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('selectTemplate')}</p>
          {templates.map((template) => {
            const isActive = selectedTemplateId === template.id;
            const hero = template.config.sections?.find((section) => section.type === 'hero');
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`w-full rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-[var(--color-primary)] bg-blue-50'
                    : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{template.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {hero?.headline || template.type}
                    </p>
                  </div>
                  <Badge variant="info">{template.type}</Badge>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('preview')}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {selectedTemplate?.name || t('selectTemplate')}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {selectedTemplate?.config.sections?.find((section) => section.type === 'hero')?.headline ||
                t('firstFunnelHelp')}
            </p>
          </div>

          <Input
            label={t('whatsappNumber')}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+60..."
          />

          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text-muted)]">
            {selectedTemplate ? (
              <>
                <span className="font-medium text-[var(--color-text)]">{selectedTemplate.name}</span>{' '}
                <span className="ml-1">{t('templateType')}: {selectedTemplate.type}</span>
              </>
            ) : (
              t('selectTemplate')
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              loading={createMutation.isPending}
              disabled={!selectedTemplateId || whatsapp.trim().length < 6}
              onClick={() => createMutation.mutate()}
            >
              {t('createFunnel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
