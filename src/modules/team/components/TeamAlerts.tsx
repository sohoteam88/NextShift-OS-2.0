'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Clock3, FileText, ShieldAlert, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { LeaderDashboardAlert } from '../types';

type Props = {
  alerts: LeaderDashboardAlert[];
};

const STORAGE_KEY = 'nextshift.team.dashboard.alert-dismissed';

type DismissMap = Record<string, number>;

function storageKeyForAlert(alert: LeaderDashboardAlert) {
  if (alert.type === 'pending_approval') return `${alert.type}:${alert.member.id}`;
  if (alert.type === 'inactive') return `${alert.type}:${alert.member.id}`;
  if (alert.type === 'no_content') return `${alert.type}:${alert.member.id}`;
  return `${alert.type}:${alert.member.id}:${alert.stuck_at_module}`;
}

function iconForType(type: LeaderDashboardAlert['type']) {
  if (type === 'pending_approval') return UserCheck;
  if (type === 'stalled_training') return ShieldAlert;
  if (type === 'no_content') return FileText;
  return Clock3;
}

function labelForType(type: LeaderDashboardAlert['type']) {
  if (type === 'pending_approval') return 'pending approval';
  if (type === 'stalled_training') return 'stalled training';
  if (type === 'no_content') return 'no content';
  return 'inactive';
}

function toneForType(type: LeaderDashboardAlert['type']) {
  if (type === 'pending_approval') return 'info';
  if (type === 'stalled_training') return 'warning';
  if (type === 'no_content') return 'warning';
  return 'danger';
}

function loadDismissed(): DismissMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as DismissMap;
  } catch {
    return {};
  }
}

function saveDismissed(map: DismissMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function TeamAlerts({ alerts }: Props) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [dismissed, setDismissed] = React.useState<DismissMap>({});

  React.useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const visible = alerts.filter((alert) => {
    const ts = dismissed[storageKeyForAlert(alert)];
    return !ts || Date.now() - ts > 24 * 60 * 60 * 1000;
  });

  function handleDismiss(alert: LeaderDashboardAlert) {
    const key = storageKeyForAlert(alert);
    const next = { ...dismissed, [key]: Date.now() };
    setDismissed(next);
    saveDismissed(next);
  }

  function handleClick(alert: LeaderDashboardAlert) {
    if (alert.type === 'pending_approval') {
      router.push('/admin/approvals');
      return;
    }
    router.push(`/team/members?member=${alert.member.id}`);
  }

  if (!visible.length) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('alerts')}</h2>
        <Badge variant="default">{visible.length}</Badge>
      </div>

      <div className="space-y-2">
        {visible.map((alert) => {
          const Icon = iconForType(alert.type);
          const tone = toneForType(alert.type);
          return (
            <div
              key={storageKeyForAlert(alert)}
              className={cn(
                'flex items-start gap-3 rounded-[var(--radius-md)] border p-3 transition-colors hover:bg-[var(--color-surface)]',
                tone === 'danger' && 'border-red-200 bg-red-50/50',
                tone === 'warning' && 'border-amber-200 bg-amber-50/50',
                tone === 'info' && 'border-blue-200 bg-blue-50/50',
              )}
            >
              <button
                type="button"
                className="mt-0.5 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-white"
                onClick={() => handleClick(alert)}
              >
                <Icon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => handleClick(alert)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[var(--color-text)]">{alert.member.name}</p>
                  <Badge variant={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'info'}>
                    {labelForType(alert.type)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {alert.type === 'inactive' && t('inactiveAlert', { days: alert.days_inactive })}
                  {alert.type === 'no_content' && t('contentAlert', { days: alert.days_without_content })}
                  {alert.type === 'pending_approval' && t('approvalAlert')}
                  {alert.type === 'stalled_training' && t('trainingAlert', { module: alert.stuck_at_module })}
                </p>
              </button>
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="h-4 w-4" />}
                onClick={() => handleDismiss(alert)}
                aria-label="Dismiss alert"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
