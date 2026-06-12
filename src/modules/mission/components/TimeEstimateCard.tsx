'use client';

interface TimeEstimateCardProps {
  estimatedTimeToFirstLead: string | null;
  estimatedTimeToFirstSale: string | null;
  locale?: 'zh' | 'en' | 'ms';
}

function display(value: string | null, locale: 'zh' | 'en' | 'ms') {
  if (!value) return locale === 'en' ? 'Not available' : locale === 'ms' ? 'Tiada anggaran' : '暂无预估';
  if (value === '已完成') return locale === 'en' ? 'Done' : locale === 'ms' ? 'Selesai' : '已完成';
  return value;
}

export function TimeEstimateCard({
  estimatedTimeToFirstLead,
  estimatedTimeToFirstSale,
  locale = 'zh',
}: TimeEstimateCardProps) {
  const title = locale === 'en' ? 'Estimated timeline' : locale === 'ms' ? 'Anggaran masa' : '预计多久完成';
  const lead = locale === 'en' ? 'First Lead' : locale === 'ms' ? 'Lead Pertama' : '第一个 Lead';
  const sale = locale === 'en' ? 'First Sale' : locale === 'ms' ? 'Jualan Pertama' : '第一笔成交';

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="text-sm font-medium text-[var(--color-text)]">🎯 {lead}</span>
          <span className="text-sm font-semibold text-[var(--color-text-muted)]">
            {estimatedTimeToFirstLead === '已完成' ? '✅ ' : ''}
            {display(estimatedTimeToFirstLead, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="text-sm font-medium text-[var(--color-text)]">💰 {sale}</span>
          <span className="text-sm font-semibold text-[var(--color-text-muted)]">
            {estimatedTimeToFirstSale === '已完成' ? '✅ ' : ''}
            {display(estimatedTimeToFirstSale, locale)}
          </span>
        </div>
      </div>
    </section>
  );
}
