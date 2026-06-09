import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Brain,
  DollarSign,
  Gauge,
  Hash,
  LineChart,
  Sparkles,
  Zap,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

function fmtMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 0.01 ? 4 : 2,
    maximumFractionDigits: value < 0.01 ? 4 : 2,
  }).format(value);
}

function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function featureLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const PROVIDER_COLOR: Record<string, string> = {
  openai: 'bg-emerald-100 text-emerald-700',
  anthropic: 'bg-orange-100 text-orange-700',
  google: 'bg-blue-100 text-blue-700',
};

export default async function AIModelUsagePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const t = await getTranslations('platformAdmin');
  const data = await platformAdminService.getAIModelBreakdown();

  const totalCostThisMonth = data.totalCostThisMonth;
  const totalTokens = data.totalTokensIn + data.totalTokensOut;
  const topModel = data.byModel[0];
  const topFeature = data.byFeature[0];
  const maxModelCost = Math.max(...data.byModel.map((m) => m.costUsd), 0.001);
  const maxFeatureCost = Math.max(...data.byFeature.map((f) => f.costUsd), 0.001);
  const maxDailyCalls = Math.max(...data.daily.map((d) => d.calls), 1);

  const cardClass =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';

  const summaryCards = [
    {
      label: t('aiMonthlySpend'),
      value: fmtMoney(totalCostThisMonth),
      helper: t('aiSpendHelper'),
      icon: DollarSign,
    },
    {
      label: t('aiMonthlyCalls'),
      value: fmtNum(data.totalCallsThisMonth),
      helper: topFeature ? t('aiTopFeature', { feature: featureLabel(topFeature.feature) }) : t('aiNoUsageYet'),
      icon: Zap,
    },
    {
      label: t('aiTokenVolume'),
      value: fmtK(totalTokens),
      helper: `In ${fmtK(data.totalTokensIn)} / Out ${fmtK(data.totalTokensOut)}`,
      icon: Hash,
    },
    {
      label: t('aiAvgCost'),
      value: fmtMoney(data.avgCostPerCall),
      helper: t('aiAvgCostHelper'),
      icon: Brain,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('platformAdmin')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('aiUsageTitle')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            {t('aiUsageSubtitle')}
          </p>
        </div>
        <Link
          href="/platform-admin"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
        >
          <Gauge className="h-4 w-4" aria-hidden="true" />
          {t('allTenants')}
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('aiSpendControl')}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[var(--color-text)]">
                {fmtMoney(totalCostThisMonth)}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('aiSpendControlDescription')}</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs text-[var(--color-text-muted)]">{t('aiTopModel')}</p>
              <p className="mt-1 max-w-[260px] truncate text-sm font-semibold text-[var(--color-text)]">
                {topModel ? topModel.model : t('aiNoUsageYet')}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {topModel ? `${fmtNum(topModel.calls)} ${t('calls')} / ${fmtMoney(topModel.costUsd)}` : t('aiWaitingForCalls')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('aiQuickActions')}</h2>
          <div className="mt-4 space-y-2">
            {[
              { href: '/platform-admin/health', label: t('systemHealth'), icon: LineChart },
              { href: '/platform-admin?tab=tenants', label: t('reviewTenantUsage'), icon: BarChart3 },
              { href: '/ai', label: t('inspectAiTools'), icon: Brain },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex h-10 items-center justify-between rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, helper, icon: Icon }) => (
          <div key={label} className={cardClass}>
            <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
              {label}
            </div>
            <p className="text-3xl font-semibold text-[var(--color-text)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">{t('aiByModel')}</h2>
          {data.byModel.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('aiNoUsageThisMonth')}</p>
          ) : (
            <div className="space-y-3">
              {data.byModel.map((row) => {
                const barWidth = Math.max(4, Math.round((row.costUsd / maxModelCost) * 100));
                return (
                  <div key={`${row.provider}-${row.model}`} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PROVIDER_COLOR[row.provider] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {row.provider}
                        </span>
                        <span className="font-medium text-[var(--color-text)]">{row.model}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-xs text-[var(--color-text-muted)]">
                        <span>{fmtNum(row.calls)} {t('calls')}</span>
                        <span>{fmtK(row.tokensIn + row.tokensOut)} tok</span>
                        <span className="font-semibold text-[var(--color-text)]">{fmtMoney(row.costUsd)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)]">
                      <div
                        className="h-2 rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">{t('aiByFeature')}</h2>
          {data.byFeature.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('aiNoUsageThisMonth')}</p>
          ) : (
            <div className="space-y-3">
              {data.byFeature.map((row) => {
                const barWidth = Math.max(4, Math.round((row.costUsd / maxFeatureCost) * 100));
                return (
                  <div key={`${row.category}-${row.feature}`} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-[var(--color-text)]">{featureLabel(row.feature)}</span>
                      <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                        {fmtNum(row.calls)} {t('calls')} / {fmtMoney(row.costUsd)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)]">
                      <div
                        className="h-2 rounded-full bg-indigo-400"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('aiDailyTrend')}</h2>
          <p className="text-xs text-[var(--color-text-muted)]">{t('aiDailyTrendHelper')}</p>
        </div>
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {data.daily.map((day) => {
            const heightPct = Math.max(4, Math.round((day.calls / maxDailyCalls) * 100));
            const label = day.date.slice(5); // MM-DD
            return (
              <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-sm bg-[var(--color-primary)] transition-all hover:bg-indigo-600" style={{ height: `${heightPct}%` }} />
                <span className="text-[9px] text-[var(--color-text-muted)]">{label}</span>
                {/* tooltip */}
                <div className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-md)] bg-gray-800 px-2 py-1 text-[10px] text-white group-hover:block">
                  {day.calls} {t('calls')} / {fmtMoney(day.cost)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.byModel.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">{t('aiModelDetails')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {['Provider', 'Model', t('calls'), 'Tokens In', 'Tokens Out', t('costUsd'), t('share')].map(
                    (h) => (
                      <th key={h} className="border-b border-[var(--color-border)] px-3 py-3">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.byModel.map((row) => (
                  <tr
                    key={`${row.provider}-${row.model}`}
                    className="text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                  >
                    <td className="border-b border-[var(--color-border)] px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PROVIDER_COLOR[row.provider] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {row.provider}
                      </span>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 font-medium">
                      {row.model}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3">
                      {fmtNum(row.calls)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 text-[var(--color-text-muted)]">
                      {fmtK(row.tokensIn)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 text-[var(--color-text-muted)]">
                      {fmtK(row.tokensOut)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 font-semibold">
                      {fmtMoney(row.costUsd)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 text-[var(--color-text-muted)]">
                      {totalCostThisMonth > 0
                        ? `${Math.round((row.costUsd / totalCostThisMonth) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
