'use client';

import { Clock3, MapPin, SkipForward } from 'lucide-react';
import type { JourneyStage } from '../constants/journey-map';
import type { MissionMode } from '../hooks/use-mission';

type Locale = 'zh' | 'en' | 'ms';

interface NextMissionCardProps {
  stage: JourneyStage;
  locale: Locale;
  onStart: () => void;
  onSkip: () => void;
  mode: MissionMode;
}

const TEXT = {
  zh: {
    title: '下一步是什么',
    why: '为什么要做',
    estimate: '预计',
    start: '开始',
    skip: '跳过这一步',
    auto: '这一步会在你完成相关操作后自动完成。',
  },
  en: {
    title: 'What is next',
    why: 'Why this matters',
    estimate: 'Estimated',
    start: 'Start',
    skip: 'Skip this step',
    auto: 'This step completes automatically after you finish the related action.',
  },
  ms: {
    title: 'Langkah seterusnya',
    why: 'Mengapa ini penting',
    estimate: 'Anggaran',
    start: 'Mula',
    skip: 'Langkau langkah ini',
    auto: 'Langkah ini selesai secara automatik selepas tindakan berkaitan dibuat.',
  },
};

function getName(stage: JourneyStage, locale: Locale) {
  if (locale === 'en') return stage.name_en;
  if (locale === 'ms') return stage.name_ms;
  return stage.name_zh;
}

function getDescription(stage: JourneyStage, locale: Locale) {
  if (locale === 'en') return stage.description_en;
  if (locale === 'ms') return stage.description_ms;
  return stage.description_zh;
}

function formatMinutes(minutes: number, locale: Locale) {
  if (minutes === 0) return TEXT[locale].auto;
  if (locale === 'en') return `about ${minutes} min`;
  if (locale === 'ms') return `lebih kurang ${minutes} min`;
  return `约 ${minutes} 分钟`;
}

export function NextMissionCard({ stage, locale, onStart, onSkip, mode }: NextMissionCardProps) {
  const copy = TEXT[locale];
  const description = getDescription(stage, locale);
  const canStart = stage.estimated_minutes > 0;

  return (
    <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white p-6 shadow-md shadow-blue-100/70">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">{copy.title}</p>

      <div className="mt-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-[var(--color-text)]">{getName(stage, locale)}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{stage.route}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">{copy.why}</p>
        <p className="mt-2 text-sm leading-6 text-blue-900/80">{description}</p>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-muted)]">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {copy.estimate}: {formatMinutes(stage.estimated_minutes, locale)}
      </div>

      {canStart ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {copy.start} →
          </button>
          {mode === 'advanced' ? (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              {copy.skip}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          {copy.auto}
        </p>
      )}
    </section>
  );
}
