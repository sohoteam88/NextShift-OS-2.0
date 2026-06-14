'use client';
import { useTranslations } from 'next-intl';
import { BarChart3, CheckCircle2, FileText } from 'lucide-react';
import type { WorkspaceCommandData } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';

export function AdminContentCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const platformNames = ['Facebook', 'Instagram', 'TikTok', 'XHS'];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('contentTitle')} description={t('contentHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('postsGenerated')} value={data.content.postsGenerated} helper={t('contentPublishedMetricHelp')} icon={FileText} />
        <MetricCard label={t('videosGenerated')} value={data.content.videosGenerated} helper={t('contentPublishedMetricHelp')} icon={FileText} />
        <MetricCard label={t('publishingActivity')} value={data.content.publishingActivity} helper={t('publishingActivityHelp')} icon={CheckCircle2} />
        <MetricCard label={t('mostUsedPlatform')} value={data.content.platforms[0]?.label ?? t('none')} helper={t('itemsCount', { count: data.content.platforms[0]?.value ?? 0 })} icon={BarChart3} />
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('platforms')}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {platformNames.map((platform) => {
            const count = data.content.platforms.find((item) => item.label.toLowerCase() === platform.toLowerCase())?.value ?? 0;
            return <div key={platform} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="font-medium">{platform}</p><p className="text-2xl font-semibold">{count}</p></div>;
          })}
        </div>
      </section>
    </div>
  );
}
