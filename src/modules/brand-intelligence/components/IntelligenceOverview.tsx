'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { AlertTriangle, ArrowLeft, BadgeInfo, Brain, Clock3, Sparkles, ShieldCheck, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBrandAdvisor } from '../hooks/useBrandAdvisor';
import { useBrandIntelligence } from '../hooks/useBrandIntelligence';
import { useBrandHealth } from '../hooks/useBrandHealth';
import { useBrandVersionHistory } from '../hooks/useBrandVersionHistory';

type IntelligenceOverviewProps = {
  userId: string;
  className?: string;
};

function PlaceholderCard({
  title,
  icon: Icon,
  detail,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  detail: string;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      </div>
      <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
        <p className="text-sm font-medium text-[var(--color-text)]">Coming Soon</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{detail}</p>
      </div>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}%</p>
    </div>
  );
}

const CATEGORY_LABELS = {
  identity: 'Identity',
  audience: 'Audience',
  messaging: 'Messaging',
  content: 'Content',
  offer: 'Offer',
  visual: 'Visual',
} as const;

export function IntelligenceOverview({ userId, className }: IntelligenceOverviewProps) {
  const { snapshot, isLoading, error } = useBrandHealth(userId);
  const { snapshot: shellSnapshot } = useBrandIntelligence(userId);
  const { snapshot: advisorSnapshot } = useBrandAdvisor(userId);
  const { snapshot: versionHistorySnapshot } = useBrandVersionHistory(userId);

  const currentVersion = versionHistorySnapshot?.versions.find(
    (version) => version.id === versionHistorySnapshot.currentVersionId,
  ) ?? null;

  if (isLoading) {
    return (
      <div className={cn('mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6', className)}>
        <div className="h-7 w-44 rounded bg-gray-200" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
          <div className="h-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-auto max-w-4xl px-4 py-8 sm:px-6', className)}>
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h1 className="text-lg font-semibold text-red-700">Brand Intelligence</h1>
          </div>
          <p className="mt-2 text-sm text-red-700">Unable to load the intelligence shell.</p>
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
          <Link href="/brand-builder/profile" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700 underline">
            <ArrowLeft className="h-4 w-4" />
            Return to Brand Builder
          </Link>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className={cn('mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Brand Builder
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">Brand Intelligence</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            The intelligence layer is live as a shell. Health, Advisor, Regeneration, and Version History will land in later phases.
          </p>
        </div>
        <Link href="/brand-builder/profile" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Brand Builder
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Overall Health</h2>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Real brand health score</p>
              <p className="mt-1 text-4xl font-semibold text-[var(--color-text)]">{snapshot.overallScore}%</p>
            </div>
            <div
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                snapshot.isComplete
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700',
              )}
            >
              {snapshot.isComplete ? 'Complete' : 'In Progress'}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricPill label="Identity" value={snapshot.categoryScores.identity} />
            <MetricPill label="Audience" value={snapshot.categoryScores.audience} />
            <MetricPill label="Messaging" value={snapshot.categoryScores.messaging} />
            <MetricPill label="Content" value={snapshot.categoryScores.content} />
            <MetricPill label="Offer" value={snapshot.categoryScores.offer} />
            <MetricPill label="Visual" value={snapshot.categoryScores.visual} />
          </div>
          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Improvement Recommendations
            </p>
            {snapshot.nextRecommendation ? (
              <p className="mt-1 text-sm text-[var(--color-text)]">{snapshot.nextRecommendation}</p>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                No recommendations yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Module Status</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-text)]">Health Score</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Coming Soon</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-text)]">Advisor</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Coming Soon</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-text)]">Regeneration</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Coming Soon</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-text)]">Version History</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {versionHistorySnapshot
                  ? `${versionHistorySnapshot.totalVersions} versions tracked`
                  : 'Coming Soon'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <BadgeInfo className="h-4 w-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Advisor</h2>
        </div>
        {advisorSnapshot ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Top Recommendation</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {advisorSnapshot.recommendations[0]?.title ?? 'None'}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {advisorSnapshot.recommendations[0]?.description ?? 'No recommendation available.'}
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Weakest Area</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {(() => {
                  const weakest = Object.entries(snapshot.categoryScores).sort((a, b) => a[1] - b[1])[0];
                  return weakest ? `${CATEGORY_LABELS[weakest[0] as keyof typeof CATEGORY_LABELS]} (${weakest[1]}%)` : 'Unknown';
                })()}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Blind Spots: {advisorSnapshot.blindSpots.length}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
            <p className="text-sm font-medium text-[var(--color-text)]">Advisor</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Coming Soon</p>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Priority Actions</p>
            {advisorSnapshot ? (
              <div className="mt-2 space-y-2">
                {advisorSnapshot.priorityActions.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{action.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{action.route}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                      {action.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Coming Soon</p>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Blind Spots Count</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">
              {advisorSnapshot?.blindSpots.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Derived from missing brand fields in the current health projection.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <PlaceholderCard
          title="Advisor"
          icon={BadgeInfo}
          detail="Advisor is now surfaced in the summary section above. This card remains as shell scaffolding for later UI expansion."
        />
        <PlaceholderCard
          title="Regeneration"
          icon={Wand2}
          detail="Regeneration workflows will be wired in later, once the intelligence layer owns the capability."
        />
        <PlaceholderCard
          title="Version History"
          icon={Sparkles}
          detail="Version history remains in Brand DNA Studio until the later migration phase."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Recent Changes</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(shellSnapshot?.recentChanges ?? []).map((item) => (
              <div key={item.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.detail}</p>
                <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)]">{item.date}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Version History</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Current Version</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {currentVersion ? `v${currentVersion.version}` : 'Unknown'}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {currentVersion?.label ?? 'Version projection is ready. Full history table will land in a later phase.'}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Version Count</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {versionHistorySnapshot?.totalVersions ?? 0}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Retention limit: {versionHistorySnapshot?.retentionLimit ?? 20}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
