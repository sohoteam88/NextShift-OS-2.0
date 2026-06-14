'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Building2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import type { AdminSettingsResponse } from '../../types';
import type { AdminFormState } from '../AdminSettingsPanel';

type Props = {
  form: AdminFormState;
  setForm: React.Dispatch<React.SetStateAction<AdminFormState>>;
  tenant: AdminSettingsResponse['data']['tenant'] | undefined;
  stats: AdminSettingsResponse['data']['stats'] | undefined;
  uploading: boolean;
  onLogoUpload: (file: File | null) => void;
};

export function GeneralSettings({ form, setForm, tenant, stats, uploading, onLogoUpload }: Props) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--color-primary)]" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('basicInfo')}</h2>
        </div>
        <Input label={t('teamName')} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('logo')}</label>
          <div className="flex flex-wrap items-center gap-3">
            <Input value={form.logoUrl} onChange={(e) => setForm((c) => ({ ...c, logoUrl: e.target.value }))} placeholder={t('logoUrlPlaceholder')} className="flex-1" />
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]">
              <Upload className="h-4 w-4" /><span>{t('uploadLogo')}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => onLogoUpload(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{uploading ? t('uploading') : t('logoHelp')}</p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('defaultLanguage')}</label>
          <select value={form.defaultLanguage} onChange={(e) => setForm((c) => ({ ...c, defaultLanguage: e.target.value }))} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm">
            <option value="zh">{t('languageZh')}</option><option value="en">{t('languageEn')}</option><option value="ms">{t('languageMs')}</option>
          </select>
        </div>
      </section>
      <section className="space-y-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('planInfo')}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-white p-3"><p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('currentPlan')}</p><p className="mt-1 text-sm font-medium text-[var(--color-text)]">{tenant?.plan ?? 'starter'}</p></div>
          <div className="rounded-[var(--radius-md)] bg-white p-3"><p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('membersLimit')}</p><p className="mt-1 text-sm font-medium text-[var(--color-text)]">{stats ? `${stats.limits.max_members} (${stats.usage.current_members})` : '—'}</p></div>
          <div className="rounded-[var(--radius-md)] bg-white p-3"><p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('aiQuota')}</p><p className="mt-1 text-sm font-medium text-[var(--color-text)]">{stats ? `${stats.limits.max_ai_calls}/mo (${stats.usage.ai_calls_this_month})` : '—'}</p></div>
        </div>
        <div className="rounded-[var(--radius-md)] bg-white p-3"><p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t('storageUsage')}</p><p className="mt-1 text-sm font-medium text-[var(--color-text)]">{stats ? `${stats.usage.storage_used_mb}MB / ${stats.limits.max_storage_mb}MB` : '—'}</p></div>
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline">{t('upgradePlan')}<ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
}
