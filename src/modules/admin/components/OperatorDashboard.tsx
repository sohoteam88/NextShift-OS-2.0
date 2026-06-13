'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, Gauge, LifeBuoy, ShieldCheck, Users } from 'lucide-react';
import { LeaderDashboard } from '@/modules/team/components/LeaderDashboard';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { Badge } from '@/components/ui/Badge';

type Props = {
  user: AuthUser;
};

export function OperatorDashboard({ user }: Props) {
  const t = useTranslations('admin');
  const dashboard = useQuery({
    queryKey: ['operator-admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json() as Promise<{ data: { stats: { limits: { max_members: number; max_ai_calls: number; max_storage_mb: number }; usage: { current_members: number; ai_calls_this_month: number; storage_used_mb: number } } } }>;
    },
  });
  const health = useQuery({
    queryKey: ['operator-health'],
    queryFn: async () => {
      const res = await fetch('/api/v1/health');
      if (!res.ok) throw new Error('Failed to load health');
      return res.json() as Promise<{ status: string; services: { database: string } }>;
    },
  });

  const stats = dashboard.data?.data.stats;
  const healthStatus = health.data?.status ?? 'unknown';
  const dbStatus = health.data?.services.database ?? 'unknown';

  return (
    <div className="space-y-6">
      <LeaderDashboard user={user} />

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('operatorExtras')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('operatorExtrasHelp')}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Users className="h-4 w-4" />
              {t('currentMembers')}
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{stats?.usage.current_members ?? '—'}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{t('membersLimit')}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Gauge className="h-4 w-4" />
              {t('aiQuota')}
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{stats ? `${stats.usage.ai_calls_this_month}/${stats.limits.max_ai_calls}` : '—'}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{t('monthUsage')}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <ShieldCheck className="h-4 w-4" />
              {t('systemHealth')}
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text)] capitalize">{healthStatus}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{t('database')} · {dbStatus}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <LifeBuoy className="h-4 w-4" />
              {t('adminShortcuts')}
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/admin/users" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                {t('usersTitle')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/beta" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                Beta Command Center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/approvals" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                {t('approvalsTitle')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/templates" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                {t('templatesTitle')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/daily-actions" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                {t('dailyActionsTitle')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/training" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                {t('trainingTitle')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/settings" className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                {t('settingsTitle')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{user.role}</Badge>
          <Badge variant="default">{user.email}</Badge>
        </div>
      </section>
    </div>
  );
}
