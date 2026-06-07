'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CreateFunnelDialog } from '@/modules/funnel/components/CreateFunnelDialog';
import { FunnelAnalyticsCard } from '@/modules/funnel/components/FunnelAnalyticsCard';
import { useFunnels } from '@/modules/funnel/hooks/use-funnels';

export default function FunnelPage() {
  const t = useTranslations('funnel');
  const empty = useTranslations('empty');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useFunnels();
  const funnels = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
        <Button onClick={() => setDialogOpen(true)}>{t('create')}</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : funnels.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-6 w-6" />}
          title={empty('funnelTitle')}
          description={empty('funnelDescription')}
          actionLabel={empty('funnelAction')}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {funnels.map(funnel => (
            <FunnelAnalyticsCard key={funnel.id} funnel={funnel} />
          ))}
        </div>
      )}

      <CreateFunnelDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
