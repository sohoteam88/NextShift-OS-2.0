import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, Gauge, Server } from 'lucide-react';
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

  const metricClass =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('platformAdmin')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('healthTitle')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('healthSubtitle')}</p>
        </div>
        <Link
          href="/platform-admin"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
        >
          <Gauge className="h-4 w-4" aria-hidden="true" />
          {t('allTenants')}
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {t('apiErrorRate')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">0.2%</p>
        </div>
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Server className="h-4 w-4 text-emerald-600" />
            {t('dbConnection')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">OK</p>
        </div>
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Gauge className="h-4 w-4 text-emerald-600" />
            {t('avgResponseTime')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">180ms</p>
        </div>
        <div className={metricClass}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {t('recentDeploy')}
          </div>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">2h ago</p>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('healthPlaceholderTitle')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          {t('healthPlaceholderDescription')}
        </p>
      </section>
    </div>
  );
}
