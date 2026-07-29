'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Clapperboard,
  FileText,
  LayoutTemplate,
  Megaphone,
  MessageCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  USER_GROWTH_REVENUE_DRIVERS,
  revenueDriverHubRoute,
  type RevenueDriverDefinition,
  type RevenueDriverId,
} from '../constants/revenue-drivers';

const DRIVER_ICONS: Record<RevenueDriverId, React.ElementType> = {
  whatsapp: MessageCircle,
  content: FileText,
  video: Clapperboard,
  ads: Megaphone,
  webinar: Sparkles,
  leadMagnet: Target,
  funnels: LayoutTemplate,
};

function DriverIcon({ id, className }: { id: RevenueDriverId; className?: string }) {
  const Icon = DRIVER_ICONS[id];
  return <Icon className={className} aria-hidden="true" />;
}

function visibleActions(driver: RevenueDriverDefinition, limit: number) {
  return driver.actions.slice(0, limit);
}

export function RevenueDriverDashboardSection() {
  const t = useTranslations('revenueDrivers');
  const featured = USER_GROWTH_REVENUE_DRIVERS[0];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {t('dashboard.badge')}
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-normal text-[var(--color-text)]">
            {t('dashboard.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t('dashboard.description')}
          </p>
        </div>
        <Link
          href={revenueDriverHubRoute(featured.id)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-blue-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {t(featured.primaryActionKey)}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {USER_GROWTH_REVENUE_DRIVERS.map((driver) => (
          <Link
            key={driver.id}
            href={revenueDriverHubRoute(driver.id)}
            className="group flex min-h-28 flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 text-blue-700 group-hover:bg-white">
                <DriverIcon id={driver.id} className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                P{driver.priority}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--color-text)]">
              {t(driver.titleKey)}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {t(driver.outcomeKey)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RevenueDriverHub() {
  const t = useTranslations('revenueDrivers');
  const searchParams = useSearchParams();
  const focused = searchParams.get('driver') as RevenueDriverId | null;
  const featured = USER_GROWTH_REVENUE_DRIVERS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {t('hub.badge')}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
              {t('hub.title')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t('hub.description')}
            </p>
          </div>
          <Link
            href={featured.route}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t(featured.primaryActionKey)}
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {USER_GROWTH_REVENUE_DRIVERS.map((driver) => {
          const isFocused = focused === driver.id;
          const actions = visibleActions(driver, driver.id === 'webinar' || driver.id === 'video' ? 6 : 4);

          return (
            <section
              key={driver.id}
              className={cn(
                'rounded-[var(--radius-lg)] border bg-white p-5 shadow-sm',
                isFocused ? 'border-blue-300 ring-2 ring-blue-100' : 'border-[var(--color-border)]',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 text-blue-700">
                    <DriverIcon id={driver.id} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--color-text)]">
                        {t(driver.titleKey)}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {t('priority', { priority: driver.priority })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {t(driver.descriptionKey)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-900">
                {t(driver.outcomeKey)}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text)] hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {t(action.labelKey)}
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <Link
                  href={driver.route}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-blue-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  {t(driver.primaryActionKey)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
