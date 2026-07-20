import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CapabilityViewNavigation } from '@/components/navigation/CapabilityViewNavigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { ProfilePageClient } from '@/modules/brand-builder/components/wizard/ProfilePageClient';
import { getBrandBuilderProfileViewModel } from '@/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel';
import { BrandDiscoveryExperience } from '@/modules/brand-discovery/components/BrandDiscoveryExperience';
import { BrandDNAStudio } from '@/modules/brand-dna/components/BrandDNAStudio';
import { resolveBrandView } from '@/lib/navigation/merged-capability-views';
import prisma from '@/lib/prisma';

const views = [
  { id: 'profile', label: '品牌档案', href: '/brand-builder/profile' },
  { id: 'discovery', label: '品牌探索', href: '/brand-builder/profile?view=discovery' },
  { id: 'dna', label: 'Brand DNA', href: '/brand-builder/profile?view=dna' },
] as const;

export default async function BrandProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  const activeView = resolveBrandView((await searchParams)?.view);

  if (activeView === 'discovery') {
    return (
      <div className="px-4 py-6">
        <CapabilityViewNavigation activeId={activeView} items={views} label="Brand views" />
        <BrandDiscoveryExperience />
      </div>
    );
  }

  if (activeView === 'dna') {
    const interview = await prisma.brandInterview.findFirst({
      where: { tenantId: user.tenantId, userId: user.id },
      select: { id: true },
    });
    return (
      <div className="px-4 py-6">
        <CapabilityViewNavigation activeId={activeView} items={views} label="Brand views" />
        {interview ? (
          <BrandDNAStudio />
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="max-w-md space-y-4 text-center">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Brand DNA</h1>
              <p className="text-sm text-[var(--color-text-muted)]">在生成 Brand DNA 之前，你需要先完成品牌访谈。访谈会帮助 AI 了解你的故事、产品和目标客户。</p>
              <Link href="/brand-builder/step/interview" className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)]">先完成品牌访谈</Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  const brandProfile = await getBrandBuilderProfileViewModel(user.id);
  return (
    <div className="px-4 py-6">
      <CapabilityViewNavigation activeId={activeView} items={views} label="Brand views" />
      <ProfilePageClient initialProfile={brandProfile} />
    </div>
  );
}
