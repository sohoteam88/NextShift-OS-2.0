import { notFound } from 'next/navigation';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { SectionRenderer } from '@/modules/funnel/components/sections/SectionRenderer';
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

  return (
    <div style={{ backgroundColor: theme.bg_color, minHeight: '100vh',
      fontFamily: theme.font === 'system' ? 'system-ui, sans-serif' : theme.font }}>
      {(config.sections ?? []).map((section, i) => (
        <SectionRenderer key={i} section={section} theme={theme} />
      ))}
    </div>
  );
}
