import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BrandDNAStudio } from '@/modules/brand-dna/components/BrandDNAStudio';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import prisma from '@/lib/prisma';

export default async function BrandDNAPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  // Guard: check if user has completed brand interview
  const interview = await prisma.brandInterview.findFirst({
    where: { tenantId: user.tenantId, userId: user.id },
    select: { id: true },
  });

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Brand DNA</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            在生成 Brand DNA 之前，你需要先完成品牌访谈。访谈会帮助 AI 了解你的故事、你的产品和你的目标客户。
          </p>
          <Link
            href="/brand-builder/step/interview"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
          >
            先完成品牌访谈
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <BrandDNAStudio />
    </div>
  );
}
