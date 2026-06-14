'use client';
import { useTranslations } from 'next-intl';
import { ListChecks } from 'lucide-react';
import type { WorkspaceCommandData } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';

export function AdminJourneyCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('journeyTitle')} description={t('journeyHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.journey.map((stage) => <MetricCard key={stage.id} label={stage.label} value={stage.users} helper={t('usersInStage')} icon={ListChecks} />)}
      </section>
    </div>
  );
}
