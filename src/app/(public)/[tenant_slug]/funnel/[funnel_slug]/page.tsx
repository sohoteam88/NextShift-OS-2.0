import { notFound } from 'next/navigation';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { PublicSectionRenderer } from '@/modules/funnel/components/renderer/PublicSectionRenderer';
import type { FunnelConfig, FunnelTheme } from '@/modules/funnel/types';

type Props = {
  params: Promise<{ tenant_slug: string; funnel_slug: string }>;
};

const DEFAULT_THEME: FunnelTheme = { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' };

export default async function PublicFunnelPage({ params }: Props) {
  const { tenant_slug, funnel_slug } = await params;

  let funnel;
  try {
    funnel = await funnelService.getBySlug(tenant_slug, funnel_slug);
  } catch {
    notFound();
  }

  // Track view (fire-and-forget)
  funnelService.trackView(funnel.id).catch(() => {});

  const config = funnel.config as unknown as FunnelConfig;
  const theme = config.theme ?? DEFAULT_THEME;
  const ctx = {
    theme,
    funnelSlug: funnel_slug,
    funnelId: funnel.id,
    funnelTitle: funnel.title,
  };

  return (
    <div style={{ backgroundColor: theme.bg_color, minHeight: '100vh',
      fontFamily: theme.font === 'system' ? 'system-ui, sans-serif' : theme.font }}>
      {(config.sections ?? []).map((section, i) => (
        <PublicSectionRenderer key={i} section={section} ctx={ctx} />
      ))}
    </div>
  );
}
