'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { useToast } from '@/stores/toast-store';
import { AITemplateManager } from '@/modules/ai/components/AITemplateManager';
import type { AdminTemplateSummary, AdminSettingsResponse } from '../types';

type FunnelTemplate = {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  thumbnail?: string | null;
};

type FunnelResponse = {
  data: Array<{
    id: string;
    template: { id: string; name: string; type: string } | null;
  }>;
};

function getUsageCount(funnels: FunnelResponse['data'], templateId: string) {
  return funnels.filter((funnel) => funnel.template?.id === templateId).length;
}

export function TemplatesPanel() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = React.useState<'funnel' | 'ai'>('funnel');

  const funnelTemplatesQuery = useQuery({
    queryKey: ['admin-funnel-templates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/funnel/templates');
      if (!res.ok) throw new Error('Failed to load funnel templates');
      return res.json() as Promise<{ data: FunnelTemplate[] }>;
    },
  });

  const funnelsQuery = useQuery({
    queryKey: ['admin-funnels-for-templates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/funnel/funnels?limit=200');
      if (!res.ok) throw new Error('Failed to load funnels');
      return res.json() as Promise<FunnelResponse>;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['admin-template-settings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json() as Promise<AdminSettingsResponse>;
    },
  });

  const defaultTemplateId = settingsQuery.data?.data.tenant.settings.first_funnel_template_id as string | undefined;
  const funnelTemplates = funnelTemplatesQuery.data?.data ?? [];
  const funnels = funnelsQuery.data?.data ?? [];

  const updateDefaultMutation = useMutation({
    mutationFn: async (templateId: string | null) => {
      const current = settingsQuery.data?.data.tenant.settings ?? {};
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...current,
            first_funnel_template_id: templateId ?? '',
          },
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to update default template');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-template-settings'] });
      toast('success', common('save'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (defaultTemplateId === templateId) {
        const current = settingsQuery.data?.data.tenant.settings ?? {};
        const settingsRes = await fetch('/api/v1/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              ...current,
              first_funnel_template_id: '',
            },
          }),
        });
        if (!settingsRes.ok) {
          const payload = await settingsRes.json().catch(() => null);
          throw new Error(payload?.error?.message ?? 'Failed to update default template');
        }
      }

      const res = await fetch(`/api/v1/funnel/templates/${templateId}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to delete template');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-funnel-templates'] });
      await qc.invalidateQueries({ queryKey: ['admin-funnels-for-templates'] });
      toast('success', common('delete'));
    },
  });

  const templates: AdminTemplateSummary[] = funnelTemplates.map((template) => ({
    id: template.id,
    name: template.name,
    type: template.type,
    usageCount: getUsageCount(funnels, template.id),
    isDefault: defaultTemplateId === template.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('templatesTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('templatesHelp')}</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-2">
        <button
          type="button"
          onClick={() => setTab('funnel')}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-medium',
            tab === 'funnel'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
          )}
        >
          <LayoutTemplate className="h-4 w-4" />
          {t('funnelTemplates')}
        </button>
        <button
          type="button"
          onClick={() => setTab('ai')}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-medium',
            tab === 'ai'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
          )}
        >
          {t('aiPromptTemplates')}
        </button>
      </div>

      {tab === 'funnel' ? (
        <div className="space-y-4">
          <div className="grid gap-3">
            {templates.map((template) => (
              <article key={template.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-[var(--color-text)]">{template.name}</h2>
                      {template.isDefault && (
                        <Badge variant="success">
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t('default')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                      <Badge variant="info">{template.type}</Badge>
                      <Badge variant="default">{t('usageCount', { count: template.usageCount })}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="h-4 w-4" />} onClick={() => router.push('/funnel')}>
                      {t('editTemplate')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateDefaultMutation.mutate(template.isDefault ? null : template.id)}
                      loading={updateDefaultMutation.isPending}
                    >
                      {template.isDefault ? t('unsetDefault') : t('setDefault')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => {
                        if (window.confirm(t('confirmTemplateDelete'))) {
                          void deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      {common('delete')}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => router.push('/funnel')}>
              {t('createFunnelTemplate')}
            </Button>
          </div>
        </div>
      ) : (
        <AITemplateManager />
      )}
    </div>
  );
}
