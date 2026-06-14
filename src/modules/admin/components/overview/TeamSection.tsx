'use client';
import { useTranslations } from 'next-intl';
import { BarChart3, CheckCircle2, Clock3, FileText, Flame, Users } from 'lucide-react';
import type { WorkspaceCommandData } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';

export function AdminTeamCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('teamTitle')} description={t('teamHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('totalTeamMembers')} value={data.overview.teamMembers} helper={t('teamMembersMetricHelp')} icon={Users} />
        <MetricCard label={t('activeThisWeekMetric')} value={data.overview.activeThisWeek} helper={t('recentActivityHelper')} icon={Flame} />
        <MetricCard label={t('contentPublishedMetric')} value={data.content.publishingActivity} helper={t('contentPublishedMetricHelp')} icon={FileText} />
        <MetricCard label={t('leadsGeneratedMetric')} value={data.overview.leads} helper={t('leadsGeneratedMetricHelp')} icon={BarChart3} />
        <MetricCard label={t('appointmentsMetric')} value={data.overview.appointments} helper={t('appointmentsMetricHelp')} icon={Clock3} />
        <MetricCard label={t('customersMetric')} value={data.overview.customers} helper={t('customersMetricHelp')} icon={CheckCircle2} />
        <MetricCard label={t('recruitmentConversion')} value={`${data.overview.conversionRate}%`} helper={t('recruitmentConversionHelp')} icon={Users} />
      </section>
    </div>
  );
}
