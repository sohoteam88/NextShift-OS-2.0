'use client';
import { useTranslations } from 'next-intl';
import type { WorkspaceCommandData, WorkspaceFunnelHealth } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { scoreTone } from './helpers';

function FunnelRow({ funnel }: { funnel: WorkspaceFunnelHealth }) {
  const t = useTranslations('admin');
  return (
    <tr className="hover:bg-[var(--color-surface)]">
      <td className="border-b border-[var(--color-border)] px-4 py-3"><p className="font-medium text-[var(--color-text)]">{funnel.title}</p><p className="text-xs text-[var(--color-text-muted)]">{funnel.status}</p></td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.published ? t('publishedStatus') : t('draftStatus')}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.views}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.conversions}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.conversionRate}%</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(funnel.healthScore)}`}>{funnel.healthScore}</span></td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.inactive ? <span className="text-amber-700">{t('noTraffic')}</span> : <span className="text-emerald-700">{t('activeStatus')}</span>}</td>
    </tr>
  );
}

export function AdminFunnelsCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const headers = [t('funnelCol'), t('publishedCol'), t('viewsCol'), t('conversionsCol'), t('conversionRateCol'), t('healthCol'), t('statusCol')];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('funnelsTitle')} description={t('funnelsHelp')} />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]"><tr>{headers.map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{data.funnels.map((funnel) => <FunnelRow key={funnel.id} funnel={funnel} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
