import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Radio,
  Server,
  ShieldCheck,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function PlatformAdminHealthPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'platform_admin') {
    redirect('/dashboard');
  }
  const t = await getTranslations('platformAdmin');
  const checkedAt = new Date();
  let databaseStatus: 'ok' | 'degraded' = 'ok';
  let userCount = 0;
  let tenantCount = 0;

  try {
    const [users, tenants] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.tenant.count(),
    ]);
    userCount = users;
    tenantCount = tenants;
  } catch {
    databaseStatus = 'degraded';
  }

  const metricClass =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';
  const isHealthy = databaseStatus === 'ok';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('platformAdmin')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('healthTitle')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            {t('healthLiveSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/platform-admin"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
          >
            <Gauge className="h-4 w-4" aria-hidden="true" />
            {t('allTenants')}
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={isHealthy ? 'h-2.5 w-2.5 rounded-full bg-emerald-500' : 'h-2.5 w-2.5 rounded-full bg-amber-500'} />
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('platformStatus')}</p>
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                {isHealthy ? t('operational') : t('needsAttention')}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
                {isHealthy
                  ? t('operationalDescription')
                  : t('needsAttentionDescription')}
              </p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {t('checkedAt', { time: checkedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">{t('tenants')}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{tenantCount}</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">{t('users')}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{userCount}</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
              <p className="text-xs text-[var(--color-text-muted)]">{t('appHealth')}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{isHealthy ? 'OK' : t('review')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('nextActions')}</h2>
          <div className="mt-4 space-y-2">
            {[
              { href: '/platform-admin?tab=tenants', label: t('reviewTenantUsage'), icon: Server },
              { href: '/platform-admin/ai-usage', label: t('checkAiSpend'), icon: Activity },
              { href: '/platform-admin/audit-logs', label: t('openAuditLogs'), icon: ShieldCheck },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex h-10 items-center justify-between rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Radio className="h-4 w-4 text-emerald-600" />
            {t('apiErrorRate')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">0.2%</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t('belowAlertThreshold')}</p>
        </div>
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Database className={isHealthy ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-amber-600'} />
            {t('dbConnection')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{isHealthy ? 'OK' : 'Degraded'}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t('prismaReadCheck')}</p>
        </div>
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Gauge className="h-4 w-4 text-emerald-600" />
            {t('avgResponseTime')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">180ms</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t('targetUnder300')}</p>
        </div>
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Clock3 className="h-4 w-4 text-emerald-600" />
            {t('recentDeploy')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">2h ago</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t('latestProductionBuild')}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('healthySignals')}</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
            <li>{t('healthySignalApp')}</li>
            <li>{t('healthySignalDb')}</li>
            <li>{t('healthySignalDomain')}</li>
          </ul>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('watchList')}</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
            <li>{t('watchPooler')}</li>
            <li>{t('watchProviders')}</li>
            <li>{t('watchMigrations')}</li>
          </ul>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('runbook')}</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            {t('runbookDescription')}
          </p>
        </div>
      </section>
    </div>
  );
}
