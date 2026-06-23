'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Clock3, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { ActivationFunnelStep, ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { FirstUserExperienceProjection } from '@/modules/product-experience/services/FirstUserExperienceService';

type Props = {
  activation: ActivationProjection;
  firstUserExperience: FirstUserExperienceProjection;
};

function statusClass(status: ActivationFunnelStep['status']) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'current') return 'border-blue-200 bg-blue-50 text-blue-900';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function statusIcon(status: ActivationFunnelStep['status']) {
  if (status === 'completed') return CheckCircle2;
  if (status === 'current') return Circle;
  return Lock;
}

function progressWidth(value: number) {
  return `${Math.max(0, Math.min(value, 100))}%`;
}

export function OnboardingActivationOverview({ activation, firstUserExperience }: Props) {
  const t = useTranslations('onboarding.activation');

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-[var(--radius-lg)] border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              {t('eyebrow')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--color-text)]">
              {t('title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href={firstUserExperience.nextActionRoute}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            {firstUserExperience.nextActionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-xs font-semibold uppercase text-blue-700">
            {t('currentStep')}
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">
            {firstUserExperience.currentStep}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {activation.currentMission.description}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-700">
            {t('progress')}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">
            {firstUserExperience.progressPercent}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: progressWidth(firstUserExperience.progressPercent) }}
            />
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {t('timeWindow')}
          </div>
          <p className="mt-2 text-lg font-bold text-[var(--color-text)]">
            {firstUserExperience.activationStatus.hoursRemaining === null
              ? t('noTimer')
              : t('hoursLeft', { hours: firstUserExperience.activationStatus.hoursRemaining })}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-700">
            {t('nextStep')}
          </p>
          <h2 className="mt-2 text-lg font-bold text-[var(--color-text)]">
            {firstUserExperience.nextMilestone}
          </h2>
          <div className="mt-5 rounded-[var(--radius-md)] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              {t('expectedOutcome')}
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-text)]">
              {firstUserExperience.expectedValue}
            </p>
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] bg-emerald-50 p-4 text-emerald-900">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              {t('firstValue')}
            </p>
            <p className="mt-2 text-sm font-semibold">
              {firstUserExperience.firstValueMoment.label}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            {t('activationFunnel')}
          </h2>
          <div className="mt-4 space-y-3">
            {activation.activationFunnel.map((step, index) => {
              const Icon = statusIcon(step.status);
              return (
                <div
                  key={step.id}
                  className={cn('flex items-start gap-3 rounded-[var(--radius-md)] border p-4', statusClass(step.status))}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <Icon className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{step.label}</p>
                    <p className="mt-1 text-xs font-semibold">
                      {t(`stepStatus.${step.status}`)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed">
                      {step.successSignal}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
