import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { postPerformanceService } from '@/modules/brand-builder/services/post-performance-service';
import { InsightsPageClient } from '@/modules/brand-builder/components/InsightsPageClient';

export default async function InsightsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const stats = await postPerformanceService.getStats(user, '30d');

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            品牌建设
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">内容分析</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            追踪帖子表现，AI 给出内容优化建议
          </p>
        </div>
        <Link
          href="/brand-builder/calendar"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← 内容日历
        </Link>
      </div>

      <InsightsPageClient initialStats={stats} />
    </div>
  );
}
