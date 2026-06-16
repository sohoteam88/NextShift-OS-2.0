'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Video, Music, Camera, Mail, Sparkles, Calendar, Library, BarChart3 } from 'lucide-react';
import { useContentEngine } from '../hooks/useContentEngine';
import { useDashboardMission } from '@/modules/dashboard/hooks/useDashboardMission';
import { usePublishingCenter } from '@/modules/content-publishing/hooks/usePublishingCenter';
import { cn } from '@/lib/cn';

const QUICK_ACTIONS = [
  { label: 'Facebook Post', icon: FileText, platform: 'facebook' },
  { label: 'Instagram Post', icon: Camera, platform: 'instagram' },
  { label: 'TikTok Script', icon: Music, platform: 'tiktok' },
  { label: 'XHS Content', icon: Sparkles, platform: 'xiaohongshu' },
  { label: 'Email Content', icon: Mail, platform: 'email' },
];

export function ContentDashboard() {
  const router = useRouter();
  const engine = useContentEngine();
  const { mission } = useDashboardMission();
  const publishing = usePublishingCenter();

  if (!engine.isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Content Engine</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason ?? 'Complete Brand Foundation first.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Content Command Center</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Content Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your AI-powered content operating system.</p>
      </div>

      {/* Today's Content Mission */}
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-800">Today&apos;s Content Mission</h2>
        </div>
        <p className="text-sm text-[var(--color-text)] font-medium mb-2">{mission.title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{mission.objective}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {mission.tasks.map(t => (
            <button
              key={t.key}
              onClick={() => router.push(t.route)}
              className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', t.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')}
            >
              {t.completed ? '✓' : '○'} {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Queue + Calendar */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold">Content Strategy</h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">{engine.strategy.objective}</p>
          <div className="space-y-2">
            {engine.strategy.contentPillars.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.emoji} {p.title}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{p.percentage}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">{engine.strategy.weeklyFrequency}x per week · {engine.strategy.recommendedPlatforms.join(', ')}</p>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold">Content Scoring</h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">Score your content on business dimensions before publishing.</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-blue-50 p-2 text-center"><span className="font-semibold text-blue-700">Trust</span><br /><span className="text-blue-600">{engine.scoreContent({ hasStory: true, wordCount: 100 }).trust}%</span></div>
            <div className="rounded bg-purple-50 p-2 text-center"><span className="font-semibold text-purple-700">Authority</span><br /><span className="text-purple-600">{engine.scoreContent({ hasEducation: true, wordCount: 100 }).authority}%</span></div>
            <div className="rounded bg-emerald-50 p-2 text-center"><span className="font-semibold text-emerald-700">Engagement</span><br /><span className="text-emerald-600">{engine.scoreContent({ hasStory: true, hasCTA: true }).engagement}%</span></div>
            <div className="rounded bg-amber-50 p-2 text-center"><span className="font-semibold text-amber-700">Lead Gen</span><br /><span className="text-amber-600">{engine.scoreContent({ hasCTA: true, hasLeadMagnet: true }).leadGeneration}%</span></div>
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.platform}
              onClick={() => router.push(`/content-engine?generate=smart&platform=${a.platform}`)}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm hover:bg-[var(--color-surface)] transition-colors"
            >
              <a.icon className="h-5 w-5 text-[var(--color-primary)]" />
              <span className="text-xs font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Publishing Status */}
      {!publishing.isLocked && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">Publishing Queue</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
            <div className="rounded bg-gray-50 p-2"><span className="font-semibold text-gray-600">{publishing.stats.drafts}</span><br /><span className="text-xs text-gray-400">Drafts</span></div>
            <div className="rounded bg-blue-50 p-2"><span className="font-semibold text-blue-600">{publishing.stats.approved}</span><br /><span className="text-xs text-blue-400">Approved</span></div>
            <div className="rounded bg-purple-50 p-2"><span className="font-semibold text-purple-600">{publishing.stats.scheduled}</span><br /><span className="text-xs text-purple-400">Scheduled</span></div>
            <div className="rounded bg-emerald-50 p-2"><span className="font-semibold text-emerald-600">{publishing.stats.published}</span><br /><span className="text-xs text-emerald-400">Published</span></div>
            <div className="rounded bg-red-50 p-2"><span className="font-semibold text-red-600">{publishing.stats.failed}</span><br /><span className="text-xs text-red-400">Failed</span></div>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Success Rate: {publishing.stats.successRate}%</p>
          {publishing.showSmartSchedule && (
            <p className="mt-1 text-xs text-purple-600">✨ Smart Scheduling enabled — AI picks optimal times</p>
          )}
        </section>
      )}
    </div>
  );
}
