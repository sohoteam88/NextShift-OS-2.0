'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { relativeTime } from '@/lib/relative-time';

type RecentActivity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string };
  lead: { id: string; name: string } | null;
};

function useRecentActivities() {
  return useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/activities?limit=10');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ data: RecentActivity[] }>;
    },
    staleTime: 30_000,
  });
}

export function RecentActivities() {
  const { data, isLoading } = useRecentActivities();
  const router = useRouter();

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text)]">最近活动</h2>
        <button
          onClick={() => router.push('/crm')}
          className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
        >
          查看全部 <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : !data?.data.length ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">暂无活动记录</p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {data.data.map((activity) => (
            <li
              key={activity.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm">
                  {activity.lead && (
                    <button
                      onClick={() => router.push(`/crm/${activity.lead!.id}`)}
                      className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                    >
                      {activity.lead.name}
                    </button>
                  )}
                  <span className="text-[var(--color-text-muted)]">—</span>
                  <span className="truncate text-[var(--color-text-muted)]">{activity.description}</span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {relativeTime(activity.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
