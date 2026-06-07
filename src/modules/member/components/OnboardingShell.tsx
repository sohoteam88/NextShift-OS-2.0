'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const STEPS = [
  { path: '/onboarding/profile', label: 'profile' },
  { path: '/onboarding/goals', label: 'goals' },
  { path: '/onboarding/brand', label: 'brand' },
  { path: '/onboarding/first-content', label: 'firstContent' },
  { path: '/onboarding/first-funnel', label: 'firstFunnel' },
  { path: '/onboarding/complete', label: 'complete' },
] as const;

function getStepIndex(pathname: string) {
  return Math.max(
    0,
    STEPS.findIndex((step) => pathname.startsWith(step.path)),
  );
}

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('onboarding');
  const stepIndex = getStepIndex(pathname);
  const progress = Math.min(5, stepIndex + 1);
  const isComplete = pathname.startsWith('/onboarding/complete');
  const [skipping, setSkipping] = React.useState(false);

  async function handleSkip() {
    setSkipping(true);
    try {
      await fetch('/api/v1/member/onboarding', { method: 'POST' });
      router.push('/dashboard');
    } finally {
      setSkipping(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {STEPS.slice(0, 5).map((step, index) => (
                  <span
                    key={step.path}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      index < progress ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                {isComplete ? t('completeStep') : `${t('step')} ${Math.min(progress, 5)} ${t('of')} 5`}
              </p>
            </div>

            {!isComplete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={skipping}
                icon={<SkipForward className="h-4 w-4" />}
                onClick={handleSkip}
              >
                {t('skip')}
              </Button>
            )}
          </div>

          <div className="px-5 py-6 lg:px-8">{children}</div>

          {!isComplete && (
            <div className="flex items-center justify-end border-t border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span>{t('progress')}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
