'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/stores/toast-store';
import type { AdminSettingsResponse } from '../types';
import { uploadTenantLogo } from '../services/upload-logo';
import { GeneralSettings } from './settings/GeneralSettings';
import { AIRouterConfig } from './settings/AIRouterConfig';
import { VoiceUploadSettings } from './settings/VoiceUploadSettings';
import { LinkSettings } from './settings/LinkSettings';

export type AdminFormState = {
  name: string; logoUrl: string; defaultLanguage: string;
  aiRouterMode: 'cost_optimized' | 'balanced' | 'quality_first' | 'zh_optimized';
  aiPreferredProvider: string; aiAutoEscalate: boolean;
  voiceUploadLimitEnabled: boolean; voiceUploadLimitPerDay: number;
};

export function AdminSettingsPanel() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = React.useState<AdminFormState>({ name: '', logoUrl: '', defaultLanguage: 'zh', aiRouterMode: 'balanced', aiPreferredProvider: 'auto', aiAutoEscalate: true, voiceUploadLimitEnabled: false, voiceUploadLimitPerDay: 3 });
  const [tenantId, setTenantId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const query = useQuery({ queryKey: ['admin-settings'], queryFn: async () => { const r = await fetch('/api/v1/admin/settings'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<AdminSettingsResponse>; } });

  React.useEffect(() => {
    const tenant = query.data?.data.tenant;
    if (tenant) { setTenantId(tenant.id); const vs = tenant.settings.voice && typeof tenant.settings.voice === 'object' && !Array.isArray(tenant.settings.voice) ? tenant.settings.voice as Record<string, unknown> : {}; const rl = vs.upload_limit_per_day; setForm({ name: tenant.name, logoUrl: typeof tenant.settings.logo_url === 'string' ? tenant.settings.logo_url : '', defaultLanguage: typeof tenant.settings.default_language === 'string' ? tenant.settings.default_language : 'zh', aiRouterMode: typeof (tenant.settings.ai_router as any)?.mode === 'string' ? (tenant.settings.ai_router as any).mode : 'balanced', aiPreferredProvider: typeof (tenant.settings.ai_router as any)?.preferred_provider === 'string' ? String((tenant.settings.ai_router as any).preferred_provider) : 'auto', aiAutoEscalate: typeof (tenant.settings.ai_router as any)?.auto_escalate === 'boolean' ? Boolean((tenant.settings.ai_router as any).auto_escalate) : true, voiceUploadLimitEnabled: typeof rl === 'number' && rl > 0, voiceUploadLimitPerDay: typeof rl === 'number' && rl > 0 ? Math.round(rl) : 3 }); }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async () => { const r = await fetch('/api/v1/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, logo_url: form.logoUrl, settings: { ...(query.data?.data.tenant.settings ?? {}), default_language: form.defaultLanguage, ai_router: { mode: form.aiRouterMode, preferred_provider: form.aiPreferredProvider === 'auto' ? null : form.aiPreferredProvider, auto_escalate: form.aiAutoEscalate }, voice: { ...((query.data?.data.tenant.settings.voice && typeof query.data.data.tenant.settings.voice === 'object' && !Array.isArray(query.data.data.tenant.settings.voice)) ? query.data.data.tenant.settings.voice as Record<string, unknown> : {}), upload_limit_per_day: form.voiceUploadLimitEnabled ? Math.max(1, Math.round(form.voiceUploadLimitPerDay || 1)) : null } } }) }); if (!r.ok) { const p = await r.json().catch(() => null); throw new Error(p?.error?.message ?? 'Failed'); } return r.json() as Promise<AdminSettingsResponse>; },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast('success', common('save')); },
  });

  async function handleLogoUpload(file: File | null) { if (!file || !tenantId) return; setUploading(true); try { const url = await uploadTenantLogo(file, tenantId); setForm(c => ({ ...c, logoUrl: url })); toast('success', t('logoUploaded')); } catch (e) { toast('error', e instanceof Error ? e.message : 'Upload failed'); } finally { setUploading(false); } }

  const tenant = query.data?.data.tenant;
  const stats = query.data?.data.stats;
  const linkSections = [
    { title: t('crmSettings'), links: [{ href: '/crm/pipeline', label: t('pipelineStages') }, { href: '/crm', label: t('defaultTags') }, { href: '/analytics', label: t('scoringRules') }] },
    { title: t('automationSettings'), links: [{ href: '/admin/daily-actions', label: t('dailyActionsDefaults') }, { href: '/admin/training', label: t('trainingModules') }] },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('settingsTitle')}</h1><p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('settingsHelp')}</p></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <GeneralSettings form={form} setForm={setForm} tenant={tenant} stats={stats} uploading={uploading} onLogoUpload={handleLogoUpload} />
        <div className="space-y-4">
          <AIRouterConfig mode={form.aiRouterMode} provider={form.aiPreferredProvider} autoEscalate={form.aiAutoEscalate} onModeChange={(v) => setForm(c => ({ ...c, aiRouterMode: v as any }))} onProviderChange={(v) => setForm(c => ({ ...c, aiPreferredProvider: v }))} onAutoEscalateChange={(v) => setForm(c => ({ ...c, aiAutoEscalate: v }))} />
          <VoiceUploadSettings unlimited={form.voiceUploadLimitEnabled} limitPerDay={form.voiceUploadLimitPerDay} onUnlimitedChange={(v) => setForm(c => ({ ...c, voiceUploadLimitEnabled: v }))} onLimitChange={(v) => setForm(c => ({ ...c, voiceUploadLimitPerDay: v }))} />
          <LinkSettings sections={linkSections} />
          <div className="flex justify-end"><Button onClick={() => mutation.mutate()} loading={mutation.isPending}>{common('save')}</Button></div>
        </div>
      </div>
      <div className="flex gap-3 text-sm text-[var(--color-text-muted)]">
        <Badge variant="info">{tenant?.slug ?? '—'}</Badge>
        <Badge variant={tenant?.status === 'active' ? 'success' : 'warning'}>{tenant?.status ?? '—'}</Badge>
      </div>
    </div>
  );
}
