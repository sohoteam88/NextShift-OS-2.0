import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import prisma from '@/lib/prisma';
import { CalendarPageClient } from '@/modules/brand-builder/components/CalendarPageClient';

export default async function ContentCalendarPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metadata: true },
  });

  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? null;
  const hasStrategy = !!(
    brandProfile &&
    (brandProfile.contentPillars || brandProfile.contentStrategy)
  );

  const items = await prisma.contentCalendar.findMany({
    where: { userId: user.id, tenantId: user.tenantId },
    orderBy: [{ date: 'asc' }, { platform: 'asc' }],
  });

  const serializedItems = items.map((item) => ({
    id: item.id,
    date: item.date.toISOString(),
    pillar: item.pillar,
    pillarEmoji: item.pillarEmoji,
    title: item.title,
    hook: item.hook,
    platform: item.platform,
    format: item.format,
    status: item.status,
    contentId: item.contentId,
    notes: item.notes,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            品牌建设
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">内容日历</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            AI 生成的 30 天内容计划，按支柱主题分配
          </p>
        </div>
        <Link
          href="/ai/brand-builder"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← 返回品牌建设
        </Link>
      </div>

      {!brandProfile ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[var(--color-text-muted)]">请先完成品牌定位问卷</p>
          <Link
            href="/ai/brand-builder"
            className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            前往品牌建设
          </Link>
        </div>
      ) : (
        <CalendarPageClient
          brandProfile={brandProfile}
          hasStrategy={hasStrategy}
          initialItems={serializedItems}
        />
      )}
    </div>
  );
}
