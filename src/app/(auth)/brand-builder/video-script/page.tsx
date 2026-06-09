import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { VideoScriptGeneratorWrapper } from '@/modules/brand-builder/components/VideoScriptGeneratorWrapper';

export default async function VideoScriptPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            品牌建设
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">视频文案生成器</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            生成 Facebook Reel、IG Reel、TikTok 和 Story 的分镜脚本
          </p>
        </div>
        <Link
          href="/brand-builder/calendar"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← 内容日历
        </Link>
      </div>

      <Suspense fallback={null}>
        <VideoScriptGeneratorWrapper />
      </Suspense>
    </div>
  );
}
