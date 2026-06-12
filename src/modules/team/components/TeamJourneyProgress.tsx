'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

type TeamJourneyRow = {
  userId: string;
  name: string;
  progressPercent: number;
  currentStageId: string | null;
  currentStageName: string;
  daysSinceLastActivity: number | null;
  stalled: boolean;
};

function useTeamJourneyProgress() {
  return useQuery({
    queryKey: ['team', 'journey-progress'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/journey-progress');
      if (!res.ok) throw new Error('Failed to load team journey progress');
      return res.json() as Promise<{ data: TeamJourneyRow[] }>;
    },
    staleTime: 60_000,
  });
}

export function TeamJourneyProgress() {
  const { data, isLoading } = useTeamJourneyProgress();
  const members = data?.data ?? [];

  if (isLoading) {
    return <Skeleton className="h-60 w-full rounded-[var(--radius-lg)]" />;
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">团队旅程进度</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">快速看到谁卡住，需要你鼓励。</p>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
          还没有团队成员进度。
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.userId} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{member.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{member.currentStageName}</p>
                </div>
                <p className="text-sm font-semibold text-blue-600">{member.progressPercent}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${member.progressPercent}%` }} />
              </div>
              {member.stalled ? (
                <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  已 {member.daysSinceLastActivity} 天没有进展，需要鼓励
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
