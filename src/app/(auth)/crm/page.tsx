'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/molecules/EmptyState';
import { LeadTable } from '@/modules/crm/components/LeadTable';
import { LeadCard } from '@/modules/crm/components/LeadCard';
import { AddLeadDialog } from '@/modules/crm/components/AddLeadDialog';
import { useLeads, type LeadFilters } from '@/modules/crm/hooks/use-leads';
import { useTags } from '@/modules/crm/hooks/use-tags';

const STAGES = [
  { value: '新线索', key: 'pipeline.newLead' },
  { value: '已联系', key: 'pipeline.contacted' },
  { value: '已确认需求', key: 'pipeline.qualified' },
  { value: '已预约', key: 'pipeline.booked' },
  { value: '已转化', key: 'pipeline.converted' },
  { value: '已流失', key: 'pipeline.lost' },
] as const;

export default function CrmPage() {
  const router = useRouter();
  const t = useTranslations('crm');
  const empty = useTranslations('empty');
  const common = useTranslations('common');
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, sort_by: 'createdAt', sort_order: 'desc' });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useLeads(filters);
  const { data: tagsData } = useTags();
  const allTags = tagsData?.data ?? [];

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const setFilter = useCallback((key: keyof LeadFilters, value: string | number | undefined) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const leads = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('lead.title')}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Kanban className="h-4 w-4" />}
            onClick={() => router.push('/crm/pipeline')}
          >
            {t('pipeline.title')}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>{t('lead.addLead')}</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Input
          name="search"
          placeholder={t('lead.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-60"
        />
        <select
          value={filters.stage ?? ''}
          onChange={(e) => setFilter('stage', e.target.value || undefined)}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">{t('lead.allStages')}</option>
          {STAGES.map((stage) => <option key={stage.value} value={stage.value}>{t(stage.key)}</option>)}
        </select>
        <select
          value={filters.sort_by ?? 'createdAt'}
          onChange={(e) => setFilter('sort_by', e.target.value)}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="createdAt">{t('lead.latest')}</option>
          <option value="score">{t('lead.scoreSort')}</option>
          <option value="name">{t('lead.nameSort')}</option>
        </select>
        {allTags.length > 0 && (
          <select
            value={filters.tag ?? ''}
            onChange={(e) => setFilter('tag', e.target.value || undefined)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">{t('lead.allTags')}</option>
            {allTags.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {!isLoading && leads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={empty('leadListTitle')}
          description={empty('leadListDescription')}
          actionLabel={empty('leadListAction')}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <LeadTable leads={leads} loading={isLoading} />
          </div>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-gray-200" />
                ))
              : leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
          </div>
        </>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
          >
            {common('previous')}
          </Button>
          <span className="text-sm text-[var(--color-text-muted)]">
            {t('lead.pageOf', { page: filters.page ?? 1, total: meta.total_pages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page === meta.total_pages}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
          >
            {common('next')}
          </Button>
        </div>
      )}

      <AddLeadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
