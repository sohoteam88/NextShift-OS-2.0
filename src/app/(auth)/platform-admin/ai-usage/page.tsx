import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Gauge, Brain, Zap, DollarSign, Hash } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

function fmt$(value: number) {
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

const PROVIDER_COLOR: Record<string, string> = {
  openai: 'bg-emerald-100 text-emerald-700',
  anthropic: 'bg-orange-100 text-orange-700',
  google: 'bg-blue-100 text-blue-700',
};

export default async function AIModelUsagePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const data = await platformAdminService.getAIModelBreakdown();

  const totalCostAllTime = data.totalCostThisMonth;
  const maxModelCost = Math.max(...data.byModel.map((m) => m.costUsd), 0.001);
  const maxFeatureCost = Math.max(...data.byFeature.map((f) => f.costUsd), 0.001);
  const maxDailyCalls = Math.max(...data.daily.map((d) => d.calls), 1);

  const cardClass =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            平台管理
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">AI 模型用量</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            本月各模型调用次数、Token 消耗与费用明细
          </p>
        </div>
        <Link
          href="/platform-admin"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
        >
          <Gauge className="h-4 w-4" />
          全部租户
        </Link>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <DollarSign className="h-4 w-4 text-[var(--color-primary)]" />
            本月总费用
          </div>
          <p className="text-3xl font-semibold text-[var(--color-text)]">{fmt$(totalCostAllTime)}</p>
        </div>
        <div className={cardClass}>
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Zap className="h-4 w-4 text-[var(--color-primary)]" />
            本月调用次数
          </div>
          <p className="text-3xl font-semibold text-[var(--color-text)]">
            {fmtNum(data.totalCallsThisMonth)}
          </p>
        </div>
        <div className={cardClass}>
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Hash className="h-4 w-4 text-[var(--color-primary)]" />
            总 Token 消耗
          </div>
          <p className="text-3xl font-semibold text-[var(--color-text)]">
            {fmtK(data.totalTokensIn + data.totalTokensOut)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            In {fmtK(data.totalTokensIn)} · Out {fmtK(data.totalTokensOut)}
          </p>
        </div>
        <div className={cardClass}>
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Brain className="h-4 w-4 text-[var(--color-primary)]" />
            平均成本/次
          </div>
          <p className="text-3xl font-semibold text-[var(--color-text)]">
            {fmt$(data.avgCostPerCall)}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        {/* By Model table */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">按模型分组</h2>
          {data.byModel.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">本月暂无调用记录</p>
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
                        <span>{fmtNum(row.calls)} 次</span>
                        <span>{fmtK(row.tokensIn + row.tokensOut)} tok</span>
                        <span className="font-semibold text-[var(--color-text)]">{fmt$(row.costUsd)}</span>
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

        {/* By Feature */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">按功能分组</h2>
          {data.byFeature.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">本月暂无调用记录</p>
          ) : (
            <div className="space-y-3">
              {data.byFeature.map((row) => {
                const barWidth = Math.max(4, Math.round((row.costUsd / maxFeatureCost) * 100));
                return (
                  <div key={`${row.category}-${row.feature}`} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-[var(--color-text)]">{row.feature}</span>
                      <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                        {fmtNum(row.calls)} 次 · {fmt$(row.costUsd)}
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

      {/* Daily trend — last 14 days */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">近 14 天调用趋势</h2>
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
                  {day.calls} 次 · {fmt$(day.cost)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model detail table */}
      {data.byModel.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">模型明细表</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {['Provider', 'Model', '调用次数', 'Tokens In', 'Tokens Out', '费用 (USD)', '占比'].map(
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
                      {fmt$(row.costUsd)}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-3 py-3 text-[var(--color-text-muted)]">
                      {totalCostAllTime > 0
                        ? `${Math.round((row.costUsd / totalCostAllTime) * 100)}%`
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
