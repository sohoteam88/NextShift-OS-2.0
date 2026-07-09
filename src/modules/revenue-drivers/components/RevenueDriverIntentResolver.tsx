'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  REVENUE_DRIVER_INTENT_FOCUS_ID,
  type RevenueDriverIntentResolution,
  type RevenueDriverResolvedIntent,
} from '../constants/revenue-driver-intents';
import { resolveRevenueRuntimeIntent } from '../runtime';

type RevenueDriverIntentResolverProps = {
  route?: string;
  className?: string;
  onResolved?: (resolution: RevenueDriverResolvedIntent) => void;
};

function auditIntent(resolution: RevenueDriverIntentResolution) {
  void fetch('/api/v1/revenue-drivers/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: resolution.route,
      intent: resolution.intent,
      status: resolution.status,
      resolvedTool: resolution.status === 'resolved' ? resolution.toolId : null,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

export function RevenueDriverIntentResolver({
  route,
  className,
  onResolved,
}: RevenueDriverIntentResolverProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('revenueDrivers');
  const auditKeyRef = React.useRef<string | null>(null);
  const currentRoute = route ?? pathname;
  const intent = searchParams.get('intent');
  const resolution = React.useMemo(
    () => resolveRevenueRuntimeIntent({
      route: currentRoute,
      intent,
      source: 'deep-link',
    }).resolution,
    [currentRoute, intent],
  );

  React.useEffect(() => {
    const auditKey = `${resolution.route}:${resolution.intent ?? 'none'}:${resolution.status}`;
    if (auditKeyRef.current === auditKey) return;
    auditKeyRef.current = auditKey;

    if (resolution.status === 'resolved') {
      onResolved?.(resolution);
    }

    if (intent) {
      auditIntent(resolution);
    }

    window.requestAnimationFrame(() => {
      const targetId = resolution.status === 'resolved'
        ? resolution.focusTargetId
        : REVENUE_DRIVER_INTENT_FOCUS_ID;
      const target = document.getElementById(targetId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [intent, onResolved, resolution]);

  if (!intent) return null;

  const resolved = resolution.status === 'resolved';
  const Icon = resolved ? CheckCircle2 : Info;

  return (
    <section
      id={REVENUE_DRIVER_INTENT_FOCUS_ID}
      className={cn(
        'rounded-[var(--radius-lg)] border p-4 shadow-sm',
        resolved
          ? 'border-blue-200 bg-blue-50 text-blue-950'
          : 'border-amber-200 bg-amber-50 text-amber-950',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white',
          resolved ? 'text-blue-700' : 'text-amber-700',
        )}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{t(resolution.titleKey as never)}</p>
            {resolved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {t('intent.resolvedBadge')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 opacity-80">
            {t(resolution.descriptionKey as never)}
          </p>
        </div>
      </div>
    </section>
  );
}
