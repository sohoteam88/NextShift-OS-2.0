'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Lightbulb, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { JourneyNextAction } from '../utils/getNextJourneyAction';

type Props = {
  action: JourneyNextAction;
  locale?: 'zh' | 'en' | 'ms';
};

const STAGE_LABELS = [
  { step: 1, zh: '品牌身份', en: 'Brand Identity', ms: 'Identiti Jenama' },
  { step: 2, zh: '社交媒体', en: 'Social Setup', ms: 'Setup Sosial' },
  { step: 3, zh: '第一篇内容', en: 'First Content', ms: 'Kandungan Pertama' },
  { step: 4, zh: '第一位潜客', en: 'First Lead', ms: 'Prospek Pertama' },
  { step: 5, zh: '第一次成交', en: 'First Customer', ms: 'Pelanggan Pertama' },
  { step: 6, zh: '跟进系统', en: 'Follow-up', ms: 'Susulan' },
  { step: 7, zh: '复制团队', en: 'Team', ms: 'Pasukan' },
];

function copy(locale: Props['locale']) {
  if (locale === 'en') return { currentGoal: '🎯 Your Current Goal', goalDescription: 'Let the system learn about you first. AI needs your story to generate the right content and strategy. No wrong choices — the system guides you step by step.', currentMission: '📍 Current Mission', estimatedTime: 'est. time', afterCompletion: 'After completion you\'ll get:', aiCoach: '🤖 AI Coach Advice', aiAdvice: 'Start with the Brand Interview. AI needs to understand your story, goals, and strengths before it can generate accurate content and customer development plans.', journeyProgress: 'Your Growth Progress', currentStage: 'Current Stage', complete: 'Complete', allComplete: 'All stages complete! Explore advanced features.', viewAdvanced: 'View Advanced Mode', beginnerMode: 'Beginner Mode', advancedMode: 'Advanced Mode' };
  if (locale === 'ms') return { currentGoal: '🎯 Matlamat Semasa Anda', goalDescription: 'Biarkan sistem mengenali anda dahulu. AI perlukan cerita anda untuk menjana kandungan yang tepat. Tiada pilihan salah — sistem membimbing langkah demi langkah.', currentMission: '📍 Misi Semasa', estimatedTime: 'anggaran masa', afterCompletion: 'Selepas selesai anda akan dapat:', aiCoach: '🤖 Nasihat Jurulatih AI', aiAdvice: 'Mulakan dengan Temuduga Jenama. AI perlu memahami cerita, matlamat, dan kekuatan anda sebelum menjana kandungan yang tepat.', journeyProgress: 'Kemajuan Anda', currentStage: 'Peringkat Semasa', complete: 'Selesai', allComplete: 'Semua peringkat selesai! Terokai ciri lanjutan.', viewAdvanced: 'Lihat Mod Lanjutan', beginnerMode: 'Mod Pemula', advancedMode: 'Mod Lanjutan' };
  return { currentGoal: '🎯 你的当前目标', goalDescription: '让系统先了解你是谁、你的故事、你的目标客户。AI 需要这些信息才能帮你生成准确的内容和策略。不用担心选错，系统会一步一步带你完成。', currentMission: '📍 当前任务', estimatedTime: '预计时间', afterCompletion: '完成后你将获得：', aiCoach: '🤖 AI 教练建议', aiAdvice: '先完成品牌探索访谈。AI 需要先了解你的故事、目标和优势，才能帮你生成更准确的内容和客户开发方向。', journeyProgress: '你的成长进度', currentStage: '当前阶段', complete: '完成', allComplete: '所有阶段已完成！探索高级功能。', viewAdvanced: '查看高级模式', beginnerMode: '新手模式', advancedMode: '高级模式' };
}

export function BeginnerJourneyView({ action, locale = 'zh' }: Props) {
  const t = copy(locale);
  const pct = Math.round((action.progressStep / action.totalSteps) * 100);
  const isComplete = action.progressStep >= action.totalSteps;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">NextShift OS</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">成长旅程</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">一步一步，建立你的线上业务。</p>
      </div>

      {/* Current Goal Card */}
      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.currentGoal}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{t.goalDescription}</p>
          </div>
        </div>
      </section>

      {/* Current Mission Card */}
      <section className={cn('rounded-[var(--radius-lg)] border bg-white p-6 shadow-sm', isComplete ? 'border-emerald-200' : 'border-[var(--color-primary)] ring-2 ring-blue-50')}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.currentMission}</h2>
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{action.title}</h3>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">{t.estimatedTime}：{action.estimatedMinutes} 分钟</span>
        </div>
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">{t.afterCompletion}</p>
          {action.outcomes.map((outcome) => (
            <div key={outcome} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {outcome}
            </div>
          ))}
        </div>
        {!isComplete && (
          <Link
            href={action.route}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] sm:w-auto"
          >
            {action.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {isComplete && (
          <p className="text-sm font-medium text-emerald-600">{t.allComplete}</p>
        )}
      </section>

      {/* Journey Progress Card */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">{t.journeyProgress}</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-text-muted)]">{t.currentStage}：{action.stageName}</span>
          <span className="text-sm font-semibold text-[var(--color-primary)]">{action.progressStep}/{action.totalSteps} {t.complete}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {STAGE_LABELS.map((s) => {
            const done = action.progressStep > s.step;
            const current = action.progressStep === s.step;
            return (
              <div key={s.step} className="text-center">
                <div className={cn('mx-auto h-3 w-3 rounded-full', done ? 'bg-emerald-500' : current ? 'bg-[var(--color-primary)] ring-2 ring-blue-200' : 'bg-gray-200')} />
                <p className={cn('mt-1 text-[10px] leading-tight', done ? 'text-emerald-600' : current ? 'text-[var(--color-primary)] font-semibold' : 'text-gray-400')}>{s[locale === 'en' ? 'en' : locale === 'ms' ? 'ms' : 'zh']}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">{pct}% {t.complete}</p>
      </section>

      {/* AI Coach Card */}
      <section className="rounded-[var(--radius-lg)] border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-2">{t.aiCoach}</h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{t.aiAdvice}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
