import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { FunnelPageLayout } from '@/modules/funnel/components/renderer/FunnelPageLayout';
import { PublicSectionRenderer } from '@/modules/funnel/components/renderer/PublicSectionRenderer';
import { PublicQuizSection } from '@/modules/funnel/components/renderer/PublicQuizSection';
import { ViewTracker } from '@/modules/funnel/components/renderer/ViewTracker';
import type { FunnelConfig, FunnelTheme, HeroSection } from '@/modules/funnel/types';

type Props = { params: Promise<{ slug: string }> };

const DEFAULT_THEME: FunnelTheme = { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' };

async function getFunnel(slug: string) {
  try {
    return await funnelService.getBySlugGlobal(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const funnel = await getFunnel(slug);
  if (!funnel) return { title: 'Not Found' };

  const config = funnel.config as unknown as FunnelConfig;
  const hero = config.sections?.find((s): s is HeroSection => s.type === 'hero');
  const title = hero?.headline ?? funnel.title;
  const description = hero?.subheadline ?? '';
  const image = hero?.image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image && { images: [{ url: image }] }),
    },
    robots: { index: false },
  };
}

export default async function PublicFunnelPage({ params }: Props) {
  const { slug } = await params;
  const funnel = await getFunnel(slug);
  if (!funnel) notFound();

  const config = funnel.config as unknown as FunnelConfig;
  const theme = config.theme ?? DEFAULT_THEME;
  const sections = config.sections ?? [];
  const isQuiz = config.type === 'quiz';
  const whatsappPhone = (funnel as { owner?: { phone?: string | null } }).owner?.phone ?? undefined;

  const ctx = {
    theme,
    funnelSlug: slug,
    funnelId: funnel.id,
    funnelTitle: funnel.title,
    whatsappPhone: whatsappPhone ?? undefined,
  };

  return (
    <FunnelPageLayout theme={theme} slug={slug}>
      <ViewTracker slug={slug} />

      {/* Render non-quiz sections */}
      {sections.map((section, i) => (
        <PublicSectionRenderer key={i} section={section} ctx={ctx} />
      ))}

      {/* Quiz section if quiz type */}
      {isQuiz && config.quiz && (
        <PublicQuizSection
          quiz={config.quiz}
          theme={theme}
          funnelSlug={slug}
          funnelId={funnel.id}
          funnelTitle={funnel.title}
          whatsappPhone={whatsappPhone}
        />
      )}
    </FunnelPageLayout>
  );
}
