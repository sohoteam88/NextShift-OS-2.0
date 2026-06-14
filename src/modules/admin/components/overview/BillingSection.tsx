'use client';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CircleDollarSign, Clock3, Users } from 'lucide-react';
import type { WorkspaceCommandData } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { useFormatters } from './helpers';

export function AdminBillingCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const { formatCurrency } = useFormatters();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('billingTitle')} description={t('billingHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label={t('activePlans')} value={data.billing.activePlans} icon={CircleDollarSign} />
        <MetricCard label={t('trialsMetric')} value={data.billing.trials} icon={Clock3} />
        <MetricCard label={t('expiredMetric')} value={data.billing.expired} icon={AlertTriangle} />
        <MetricCard label={t('failedPayments')} value={data.billing.failedPayments} icon={AlertTriangle} />
        <MetricCard label={t('gracePeriodUsers')} value={data.billing.gracePeriodUsers} icon={Users} />
        <MetricCard label={t('mrrMetric')} value={formatCurrency(data.billing.mrr)} icon={CircleDollarSign} />
      </section>
    </div>
  );
}
