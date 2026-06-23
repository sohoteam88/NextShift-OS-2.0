import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { OutcomeMetrics } from '@/modules/value/contracts/ValueProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';
import type { CustomerHealthProjection } from '@/modules/customer-health/contracts/CustomerHealthProjection';

type MomentumCardProps = {
  metrics: OutcomeMetrics;
  customerHealth?: CustomerHealthProjection;
  retention?: RetentionProjection;
  expansion?: ExpansionProjection;
  referral?: ReferralProjection;
  setupHref: string;
};

export function MomentumCard({ metrics, customerHealth, retention, expansion, referral, setupHref }: MomentumCardProps) {
  const healthT = useTranslations('health.dashboard');
  const retentionT = useTranslations('retention.dashboard');
  const expansionT = useTranslations('expansion.dashboard');
  const referralT = useTranslations('referral.dashboard');
  const hasBusinessData = [
    metrics.contentPublished,
    metrics.leadsGenerated,
    metrics.appointmentsBooked,
    metrics.customersAcquired,
    metrics.revenueGenerated,
  ].some((value) => value > 0);
  const items = [
    { label: '已发布内容', value: metrics.contentPublished },
    { label: '浏览量', value: metrics.viewsGenerated },
    { label: '潜在客户', value: metrics.leadsGenerated },
    { label: '预约', value: metrics.appointmentsBooked },
    { label: '客户', value: metrics.customersAcquired },
    { label: '收入', value: `RM ${metrics.revenueGenerated}` },
  ].filter((item) => item.value !== 0 && item.value !== 'RM 0');

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-emerald-600" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          Business Momentum
        </h2>
      </div>
      {hasBusinessData ? (
        <div className="space-y-4">
          {customerHealth ? (
            <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{healthT('healthLevel')}</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {customerHealth.customerHealth.healthLevelLabel} · {customerHealth.customerHealth.healthScore}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{healthT('trend')}</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{customerHealth.healthTrend.direction}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{healthT('recommendedAction')}</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{customerHealth.recommendedAction.title}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{healthT('topDrivers')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customerHealth.customerHealth.healthDrivers.slice(0, 3).map((driver) => (
                      <span
                        key={driver.type}
                        className="rounded-[var(--radius-sm)] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                      >
                        {driver.title}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{healthT('topRisks')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customerHealth.customerHealth.riskFactors.length > 0
                      ? customerHealth.customerHealth.riskFactors.slice(0, 3).map((risk) => (
                        <span
                          key={risk.type}
                          className="rounded-[var(--radius-sm)] bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                        >
                          {risk.title}
                        </span>
                      ))
                      : (
                        <span className="rounded-[var(--radius-sm)] bg-white px-2 py-1 text-xs font-semibold text-slate-900">
                          {customerHealth.recommendedAction.title}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {retention ? (
            <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-700">{retentionT('currentLevel')}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-950">{retention.outcomeRetention.retentionLevelLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">{retentionT('nextOutcome')}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-950">{retention.outcomeRecommendation.label}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">{retentionT('momentum')}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-950">{retention.outcomeRetention.progressPercentage}%</p>
                </div>
              </div>
              {retention.momentum.recentWins.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-emerald-700">{retentionT('recentWins')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {retention.momentum.recentWins.slice(0, 3).map((win) => (
                      <span
                        key={`${win.type}-${win.occurredAt}-${win.title}`}
                        className="rounded-[var(--radius-sm)] bg-white px-2 py-1 text-xs font-semibold text-emerald-900"
                      >
                        {win.title}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-emerald-900">{retention.currentMomentum}</p>
            </div>
          ) : null}
          {expansion ? (
            <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-blue-700">{expansionT('currentLevel')}</p>
                  <p className="mt-1 text-sm font-bold text-blue-950">{expansion.expansionState.expansionLevelLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700">{expansionT('nextOpportunity')}</p>
                  <p className="mt-1 text-sm font-bold text-blue-950">{expansion.expansionState.nextExpansionOpportunityLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700">{expansionT('progress')}</p>
                  <p className="mt-1 text-sm font-bold text-blue-950">{expansion.expansionState.expansionProgress}%</p>
                </div>
              </div>
              {expansion.expansionCelebrations.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-blue-700">{expansionT('recentGrowth')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expansion.expansionCelebrations.slice(0, 3).map((celebration) => (
                      <span
                        key={`${celebration.id}-${celebration.occurredAt}`}
                        className="rounded-[var(--radius-sm)] bg-white px-2 py-1 text-xs font-semibold text-blue-900"
                      >
                        {celebration.title}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-blue-900">{expansion.expansionOpportunity.reason}</p>
            </div>
          ) : null}
          {referral ? (
            <div className="rounded-[var(--radius-md)] border border-violet-100 bg-violet-50 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold text-violet-700">{referralT('referralLevel')}</p>
                  <p className="mt-1 text-sm font-bold text-violet-950">{referral.referralState.referralLevelLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-700">{referralT('successfulReferrals')}</p>
                  <p className="mt-1 text-sm font-bold text-violet-950">{referral.referralState.successfulReferrals}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-700">{referralT('pendingReferrals')}</p>
                  <p className="mt-1 text-sm font-bold text-violet-950">{referral.referralState.pendingReferrals}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-700">{referralT('nextOpportunity')}</p>
                  <p className="mt-1 text-sm font-bold text-violet-950">{referral.referralState.nextReferralOpportunityLabel}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-violet-900">{referral.referralRecommendation.reason}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-xs text-[var(--color-text-muted)]">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-text)]">
            No Business Data Yet
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            完成当前任务后，你的内容、漏斗、Leads
            和销售数据会自动出现在这里。
          </p>
          <Link
            href={setupHref}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            继续当前任务 <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
