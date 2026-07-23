import { createElement } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type AICommandCardProps = {
  todayMission: string;
  missionDescription: string;
  missionReason: string;
  estimatedTime: string;
  executeRoute: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
};

const h = createElement;

/** The dashboard's single decision surface: what to do now, and why. */
export function AICommandCardView({
  todayMission,
  missionDescription,
  missionReason,
  estimatedTime,
  executeRoute,
  primaryActionLabel,
  onPrimaryAction,
}: AICommandCardProps) {
  const t = useTranslations('dashboard.aiCommand');
  return h(
    'section',
    { className: 'rounded-[var(--radius-lg)] border border-blue-200 bg-white p-5 shadow-sm md:p-7', 'data-testid': 'today-mission-card' },
    h(
      'div',
      { className: 'max-w-3xl' },
      h('div', { className: 'inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700' }, h(Sparkles, { className: 'h-4 w-4', 'aria-hidden': true }), t('nextStepBadge')),
      h('p', { className: 'mt-5 text-sm font-semibold text-blue-700' }, t('todayFocus')),
      h('h1', { className: 'mt-2 text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl' }, todayMission),
      h('p', { className: 'mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]' }, missionDescription),
      h('details', { className: 'mt-5 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50/40 px-4 py-3' }, h('summary', { className: 'cursor-pointer text-sm font-semibold text-blue-800' }, t('whyThisCompact')), h('p', { className: 'mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)]' }, missionReason)),
      h('div', { className: 'mt-6 flex flex-col gap-3 sm:flex-row sm:items-center' }, h(Link, { href: executeRoute, onClick: onPrimaryAction, className: 'inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700' }, primaryActionLabel ?? t('startMission'), ' ', h(ArrowRight, { className: 'h-4 w-4', 'aria-hidden': true })), h('div', { className: 'inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]' }, h(Clock3, { className: 'h-4 w-4', 'aria-hidden': true }), estimatedTime)),
    ),
  );
}

export { AICommandCardView as AICommandCard };
