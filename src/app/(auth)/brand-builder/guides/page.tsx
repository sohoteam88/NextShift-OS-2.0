import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import prisma from '@/lib/prisma';
import { PlatformGuideStep } from '@/modules/brand-builder/components/PlatformGuideStep';

export default async function BrandBuilderGuidesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const t = await getTranslations('brandBuilder');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metadata: true, phone: true },
  });

  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? null;
  const platforms = (brandProfile?.platforms as string[] | undefined) ?? ['facebook', 'instagram'];
  const phone = dbUser?.phone ?? '';

  const latestFunnel = await prisma.funnel.findFirst({
    where: { ownerId: user.id, status: 'published' },
    select: { slug: true },
  });
  const funnelUrl = latestFunnel
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase', 'nextshiftos') ?? ''}/f/${latestFunnel.slug}`
    : '';

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            品牌建设
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
            {t('standaloneTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('standaloneSubtitle')}</p>
        </div>
      </div>

      {!brandProfile ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[var(--color-text-muted)]">{t('noProfile')}</p>
          <Link
            href="/ai/brand-builder"
            className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            {t('goToBuilder')}
          </Link>
        </div>
      ) : (
        <PlatformGuideStep
          brandProfile={brandProfile}
          platforms={platforms}
          phone={phone}
          funnelUrl={funnelUrl}
        />
      )}
    </div>
  );
}
