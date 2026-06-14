'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { WorkspaceCommandData } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { useFormatters } from './helpers';

export function AdminOperationsCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const { formatDate } = useFormatters();
  const tasks = [
    ...data.attention.map((item) => ({ label: `${item.value} ${item.label}`, href: item.href })),
    { label: t('membersRequiringFollowUp', { count: data.members.filter((item) => item.needsHelp).length }), href: '/admin/members' },
    { label: t('funnelsRequiringAttention', { count: data.funnels.filter((item) => item.inactive).length }), href: '/admin/funnels' },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('operationsTitle')} description={t('operationsHelp')} />
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('todayTasks')}</h2>
        <div className="mt-4 space-y-2">
          {tasks.map((task) => (
            <Link key={`${task.href}-${task.label}`} href={task.href} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3 text-sm hover:bg-[var(--color-surface)]">
              <span>{task.label}</span><ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('recentActivity')}</h2>
        <div className="mt-4 space-y-3">
          {data.activity.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">{t('noRecentActivity')}</p> : data.activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--color-text)]">{item.label}</span>
              <span className="whitespace-nowrap text-[var(--color-text-muted)]">{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
