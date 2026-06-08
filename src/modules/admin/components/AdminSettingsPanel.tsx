'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, Building2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/stores/toast-store';
import type { AdminSettingsResponse } from '../types';
import { uploadTenantLogo } from '../services/upload-logo';

type FormState = {
  name: string;
  logoUrl: string;
  defaultLanguage: string;
};

export function AdminSettingsPanel() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = React.useState<FormState>({ name: '', logoUrl: '', defaultLanguage: 'zh' });
  const [tenantId, setTenantId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const query = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json() as Promise<AdminSettingsResponse>;
    },
  });

  React.useEffect(() => {
    const tenant = query.data?.data.tenant;
    if (tenant) {
      setTenantId(tenant.id);
      setForm({
        name: tenant.name,
        logoUrl: typeof tenant.settings.logo_url === 'string' ? tenant.settings.logo_url : '',
        defaultLanguage: typeof tenant.settings.default_language === 'string' ? tenant.settings.default_language : 'zh',
      });
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          logo_url: form.logoUrl,
          settings: {
            default_language: form.defaultLanguage,
          },
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save settings');
      }
      return res.json() as Promise<AdminSettingsResponse>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast('success', common('save'));
    },
  });

  async function handleLogoUpload(file: File | null) {
    if (!file || !tenantId) return;
    setUploading(true);
    try {
      const url = await uploadTenantLogo(file, tenantId);
      setForm((current) => ({ ...current, logoUrl: url }));
      toast('success', t('logoUploaded'));
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const tenant = query.data?.data.tenant;
  const stats = query.data?.data.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('settingsTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('settingsHelp')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--color-primary)]" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t('basicInfo')}</h2>
            </div>
            <Input label={t('teamName')} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text)]">{t('logo')}</label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={form.logoUrl}
                  onChange={(e) => setForm((current) => ({ ...current, logoUrl: e.target.value }))}
                  placeholder={t('logoUrlPlaceholder')}
                  className="flex-1"
                />
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]">
                  <Upload className="h-4 w-4" />
                  <span>{t('uploadLogo')}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{uploading ? t('uploading') : t('logoHelp')}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text)]">{t('defaultLanguage')}</label>
              <select
                value={form.defaultLanguage}
                onChange={(e) => setForm((current) => ({ ...current, defaultLanguage: e.target.value }))}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm"
              >
                <option value="zh">{t('languageZh')}</option>
                <option value="en">{t('languageEn')}</option>
                <option value="ms">{t('languageMs')}</option>
              </select>
            </div>
          </section>

          <section className="space-y-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('planInfo')}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('currentPlan')}</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text)]">{tenant?.plan ?? 'starter'}</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('membersLimit')}</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                  {stats ? `${stats.limits.max_members} (${stats.usage.current_members})` : '—'}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('aiQuota')}</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                  {stats ? `${stats.limits.max_ai_calls}/mo (${stats.usage.ai_calls_this_month})` : '—'}
                </p>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('storageUsage')}</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {stats ? `${stats.usage.storage_used_mb}MB / ${stats.limits.max_storage_mb}MB` : '—'}
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {t('upgradePlan')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('crmSettings')}</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              <Link href="/crm/pipeline" className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 hover:bg-gray-100">
                {t('pipelineStages')}
              </Link>
              <Link href="/crm" className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 hover:bg-gray-100">
                {t('defaultTags')}
              </Link>
              <Link href="/analytics" className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 hover:bg-gray-100">
                {t('scoringRules')}
              </Link>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('automationSettings')}</h2>
            <div className="mt-4 space-y-3">
              <Link href="/admin/daily-actions" className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 hover:bg-gray-100">
                {t('dailyActionsDefaults')}
              </Link>
              <Link href="/admin/training" className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 hover:bg-gray-100">
                {t('trainingModules')}
              </Link>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
              {common('save')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 text-sm text-[var(--color-text-muted)]">
        <Badge variant="info">{tenant?.slug ?? '—'}</Badge>
        <Badge variant={tenant?.status === 'active' ? 'success' : 'warning'}>{tenant?.status ?? '—'}</Badge>
      </div>
    </div>
  );
}
