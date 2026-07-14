import { createElement } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, Route, Sparkles, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FirstUserExperienceProjection } from '@/modules/product-experience/services/FirstUserExperienceService';
import type { UserSuccessProjection } from '@/modules/user-success/contracts/UserSuccessProjection';

export type DashboardPriorityLevel = 'Critical' | 'High' | 'Normal';

export type AICommandCardProps = {
  completedItems: string[];
  currentGap: string;
  todayMission: string;
  missionDescription: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    required: boolean;
  }>;
  currentStep: {
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    required: boolean;
  } | null;
  progress: number;
  passedChecks: string[];
  remainingChecks: number;
  nextRequiredCheck: string | null;
  verificationStatus: 'VERIFIED' | 'VERIFYING' | 'BLOCKED';
  missionReason: string;
  whyNow: string;
  decisionReason: string;
  nextMilestone: string;
  priorityLevel: DashboardPriorityLevel;
  estimatedTime: string;
  expectedOutcome: string;
  firstUserExperience?: FirstUserExperienceProjection;
  userSuccess?: UserSuccessProjection;
  executeRoute: string;
  primaryActionLabel?: string;
  alternativeSuggestion?: {
    title: string;
    rationale: string;
    open: boolean;
    onToggle: () => void;
  };
  discussion?: ReactNode;
};

const h = createElement;

function priorityClass(priorityLevel: DashboardPriorityLevel) {
  if (priorityLevel === 'Critical') return 'border-red-100 bg-red-50 text-red-800';
  if (priorityLevel === 'High') return 'border-amber-100 bg-amber-50 text-amber-800';
  return 'border-blue-100 bg-blue-50 text-blue-800';
}

export function AICommandCardView({
  completedItems,
  currentGap,
  todayMission,
  missionDescription,
  steps,
  currentStep,
  progress,
  passedChecks,
  remainingChecks,
  nextRequiredCheck,
  verificationStatus,
  missionReason,
  whyNow,
  decisionReason,
  nextMilestone,
  priorityLevel,
  estimatedTime,
  expectedOutcome,
  firstUserExperience,
  userSuccess,
  executeRoute,
  primaryActionLabel,
  alternativeSuggestion,
  discussion,
}: AICommandCardProps) {
  const t = useTranslations('dashboard.aiCommand');
  const activationT = useTranslations('activation.dashboard');
  const successT = useTranslations('success.dashboard');

  const alternative = alternativeSuggestion
    ? h(
      'div',
      {
        className: 'mt-4 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50/40 px-4 py-3',
        'data-testid': 'mission-alternative-suggestion',
      },
      h(
        'div',
        { className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
        h('p', { className: 'text-sm font-semibold text-blue-800' }, t('alternativeSuggestion')),
        h(
          'button',
          {
            type: 'button',
            className: 'text-sm font-semibold text-blue-700 hover:text-[var(--color-text)]',
            onClick: alternativeSuggestion.onToggle,
            'aria-expanded': alternativeSuggestion.open,
            'aria-controls': 'mission-alternative-suggestion-details',
          },
          alternativeSuggestion.open ? t('hideAlternativeSuggestion') : t('viewAlternativeSuggestion'),
        ),
      ),
      alternativeSuggestion.open
        ? h(
          'div',
          { id: 'mission-alternative-suggestion-details', className: 'mt-3 space-y-2' },
          h('p', { className: 'text-sm font-semibold text-[var(--color-text)]' }, alternativeSuggestion.title),
          h('p', { className: 'text-sm leading-relaxed text-[var(--color-text-muted)]' }, alternativeSuggestion.rationale),
        )
        : null,
    )
    : null;

  const firstUserExperienceCard = firstUserExperience
    ? h(
      'div',
      { className: 'mt-4 rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4 text-emerald-900' },
      h(
        'div',
        { className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
        h(
          'div',
          null,
          h('p', { className: 'text-xs font-semibold uppercase text-emerald-700' }, activationT('firstValue')),
          h('p', { className: 'mt-1 text-sm font-semibold' }, firstUserExperience.firstValueMoment.label),
        ),
        h('p', { className: 'text-sm font-bold' }, `${firstUserExperience.progressPercent}%`),
      ),
      h(
        'div',
        { className: 'mt-3 h-2 overflow-hidden rounded-full bg-emerald-100' },
        h('div', {
          className: 'h-full rounded-full bg-emerald-600',
          style: { width: `${Math.max(0, Math.min(firstUserExperience.progressPercent, 100))}%` },
        }),
      ),
      h(
        'div',
        { className: 'mt-3 grid gap-2 text-xs font-semibold sm:grid-cols-2' },
        h(
          'div',
          { className: 'rounded-[var(--radius-sm)] border border-emerald-100 bg-white px-3 py-2' },
          `${activationT('state')}: ${firstUserExperience.activationStatus.stateLabel}`,
        ),
        h(
          'div',
          { className: 'rounded-[var(--radius-sm)] border border-emerald-100 bg-white px-3 py-2' },
          firstUserExperience.activationStatus.hoursRemaining === null
            ? activationT('noTimer')
            : activationT('hoursLeft', { hours: firstUserExperience.activationStatus.hoursRemaining }),
        ),
      ),
    )
    : null;

  const userSuccessCard = userSuccess
    ? h(
      'div',
      { className: 'mt-4 rounded-[var(--radius-md)] border border-sky-100 bg-sky-50 p-4 text-sky-950' },
      h(
        'div',
        { className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
        h(
          'div',
          null,
          h('p', { className: 'text-xs font-semibold uppercase text-sky-700' }, successT('currentOutcome')),
          h('p', { className: 'mt-1 text-sm font-semibold' }, userSuccess.currentOutcome.label),
        ),
        h('p', { className: 'text-sm font-bold' }, `${userSuccess.successState.progressPercentage}%`),
      ),
      h(
        'div',
        { className: 'mt-3 h-2 overflow-hidden rounded-full bg-sky-100' },
        h('div', {
          className: 'h-full rounded-full bg-sky-600',
          style: { width: `${Math.max(0, Math.min(userSuccess.successState.progressPercentage, 100))}%` },
        }),
      ),
      h(
        'div',
        { className: 'mt-3 grid gap-2 text-xs font-semibold sm:grid-cols-3' },
        h(
          'div',
          { className: 'rounded-[var(--radius-sm)] border border-sky-100 bg-white px-3 py-2' },
          `${successT('progress')}: ${userSuccess.outcomeProgress.successProgressPercentage}%`,
        ),
        h(
          'div',
          { className: 'rounded-[var(--radius-sm)] border border-sky-100 bg-white px-3 py-2' },
          `${successT('currentResult')}: ${userSuccess.currentOutcome.currentResult}`,
        ),
        h(
          'div',
          { className: 'rounded-[var(--radius-sm)] border border-sky-100 bg-white px-3 py-2' },
          `${successT('nextMilestone')}: ${userSuccess.currentOutcome.nextMilestone}`,
        ),
      ),
    )
    : null;

  return h(
    'section',
    {
      className: 'rounded-[var(--radius-lg)] border border-blue-200 bg-white shadow-sm',
      'data-testid': 'today-mission-card',
    },
    h(
      'div',
      { className: 'grid gap-0 lg:grid-cols-[1.35fr_0.65fr]' },
      h(
        'div',
        { className: 'flex min-h-[380px] flex-col justify-between gap-7 p-5 md:p-7' },
        h(
          'div',
          null,
          h(
            'div',
            { className: 'mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700' },
            h(Sparkles, { className: 'h-4 w-4', 'aria-hidden': true }),
            t('nextStepBadge'),
          ),
          firstUserExperience
            ? h('p', { className: 'mb-3 text-sm font-semibold text-emerald-700' }, firstUserExperience.headline)
            : null,
          h('p', { className: 'text-sm font-semibold text-blue-700' }, t('todayFocus')),
          h('h1', { className: 'mt-3 max-w-3xl text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl' }, todayMission),
          h('p', { className: 'mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]' }, missionDescription),
          alternative,
        ),
        h(
          'div',
          null,
          h(
            'div',
            { className: 'space-y-4 border-l-2 border-blue-100 pl-4' },
            h(
              'div',
              null,
              h('p', { className: 'text-xs font-semibold uppercase text-blue-700' }, t('whyThis')),
              h(
                'p',
                { className: 'mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)]' },
                missionReason,
              ),
              discussion,
            ),
            h(
              'div',
              null,
              h('p', { className: 'text-xs font-semibold uppercase text-blue-700' }, t('whyNow')),
              h('p', { className: 'mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]' }, whyNow),
            ),
            h(
              'div',
              null,
              h('p', { className: 'text-xs font-semibold uppercase text-blue-700' }, t('whyNotOthers')),
              h('p', { className: 'mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]' }, decisionReason),
            ),
          ),
          h(
            'div',
            { className: 'mt-5 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50/40 p-4' },
            h(
              'div',
              { className: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
              h(
                'div',
                null,
                h('p', { className: 'text-xs font-semibold uppercase text-blue-700' }, t('currentStep')),
                h('p', { className: 'mt-1 text-sm font-semibold text-[var(--color-text)]' }, currentStep ? currentStep.title : t('missionVerifying')),
              ),
              h('p', { className: 'text-sm font-semibold text-blue-700' }, t('progressComplete', { progress })),
            ),
            h(
              'div',
              { className: 'mt-3 grid gap-2 text-xs font-semibold text-blue-800 sm:grid-cols-3' },
              h('div', { className: 'rounded-[var(--radius-sm)] border border-blue-100 bg-white px-3 py-2' }, t('verifiedCount', { count: passedChecks.length })),
              h('div', { className: 'rounded-[var(--radius-sm)] border border-blue-100 bg-white px-3 py-2' }, t('remainingCount', { count: remainingChecks })),
              h('div', { className: 'rounded-[var(--radius-sm)] border border-blue-100 bg-white px-3 py-2' }, t(`verificationStatus.${verificationStatus}`)),
            ),
            h(
              'div',
              { className: 'mt-3 h-2 overflow-hidden rounded-full bg-blue-100' },
              h('div', {
                className: 'h-full rounded-full bg-blue-600',
                style: { width: `${Math.max(0, Math.min(progress, 100))}%` },
              }),
            ),
            nextRequiredCheck
              ? h('p', { className: 'mt-3 text-xs font-semibold text-blue-800' }, t('nextRequiredCheck', { check: nextRequiredCheck }))
              : null,
            currentStep
              ? h('p', { className: 'mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]' }, currentStep.description)
              : null,
          ),
          firstUserExperienceCard,
          userSuccessCard,
          h(
            'div',
            { className: 'mt-5 flex flex-col gap-3 sm:flex-row sm:items-center' },
            h(
              Link,
              {
                href: executeRoute,
                className: 'inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700',
              },
              primaryActionLabel ?? t('startMission'),
              ' ',
              h(ArrowRight, { className: 'h-4 w-4', 'aria-hidden': true }),
            ),
            h(
              'div',
              { className: 'inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]' },
              h(Clock3, { className: 'h-4 w-4', 'aria-hidden': true }),
              estimatedTime,
            ),
          ),
        ),
      ),
      h(
        'aside',
        { className: 'border-t border-blue-100 bg-blue-50/40 p-5 lg:border-l lg:border-t-0 md:p-6' },
        h(
          'div',
          { className: 'space-y-5' },
          h(
            'div',
            null,
            h('p', { className: 'text-xs font-semibold text-emerald-700' }, t('completed')),
            h(
              'div',
              { className: 'mt-3 space-y-2' },
              completedItems.length > 0
                ? completedItems.map((item) => h(
                  'div',
                  { key: item, className: 'flex items-start gap-2 text-sm font-semibold text-emerald-950' },
                  h(Check, { className: 'mt-0.5 h-4 w-4 shrink-0 text-emerald-700', 'aria-hidden': true }),
                  h('span', null, item),
                ))
                : h('p', { className: 'text-sm font-medium text-emerald-950' }, t('confirmingFoundation')),
            ),
          ),
          h('div', { className: 'h-px bg-blue-100' }),
          h(
            'div',
            null,
            h('p', { className: 'text-xs font-semibold text-blue-700' }, t('executionSteps')),
            h(
              'div',
              { className: 'mt-3 space-y-3' },
              steps.map((step, index) => h(
                'div',
                { key: step.id, className: 'flex gap-3 text-sm' },
                h('span', { className: 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700' }, index + 1),
                h(
                  'div',
                  null,
                  h('p', { className: 'font-semibold text-[var(--color-text)]' }, step.title),
                  h('p', { className: 'mt-1 leading-relaxed text-[var(--color-text-muted)]' }, t('minutes', { minutes: step.estimatedMinutes })),
                ),
              )),
            ),
          ),
          h('div', { className: 'h-px bg-blue-100' }),
          h(
            'div',
            { className: 'grid grid-cols-2 gap-3' },
            h(
              'div',
              { className: `rounded-[var(--radius-md)] border p-3 ${priorityClass(priorityLevel)}` },
              h('p', { className: 'text-xs font-semibold' }, t('priority')),
              h('p', { className: 'mt-2 text-xl font-bold' }, t(`priorityLevel.${priorityLevel}`)),
            ),
            h(
              'div',
              { className: 'rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-3 text-red-800' },
              h('p', { className: 'text-xs font-semibold' }, t('currentGap')),
              h('p', { className: 'mt-2 text-sm font-bold leading-snug' }, currentGap),
            ),
          ),
          h(
            'div',
            null,
            h(
              'div',
              { className: 'flex items-center gap-2' },
              h(Target, { className: 'h-4 w-4 text-emerald-700', 'aria-hidden': true }),
              h('p', { className: 'text-xs font-semibold text-emerald-700' }, t('expectedOutcome')),
            ),
            h('p', { className: 'mt-2 text-base font-semibold text-emerald-950' }, expectedOutcome),
          ),
          h('div', { className: 'h-px bg-blue-100' }),
          h(
            'div',
            null,
            h(
              'div',
              { className: 'flex items-center gap-2' },
              h(Route, { className: 'h-4 w-4 text-blue-700', 'aria-hidden': true }),
              h('p', { className: 'text-xs font-semibold text-blue-700' }, t('nextMilestone')),
            ),
            h(
              'div',
              { className: 'mt-3 space-y-2 text-sm text-[var(--color-text-muted)]' },
              h('p', null, h('span', { className: 'font-semibold text-[var(--color-text)]' }, nextMilestone)),
              h('p', null, t('nextMilestoneHelp')),
            ),
          ),
        ),
      ),
    ),
  );
}

export { AICommandCardView as AICommandCard };
