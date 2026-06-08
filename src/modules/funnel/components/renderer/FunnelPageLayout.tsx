import type { FunnelTheme } from '../../types';

type Props = {
  theme: FunnelTheme;
  children: React.ReactNode;
  slug: string;
};

const fontMap: Record<string, string> = {
  system: 'system-ui, -apple-system, sans-serif',
  inter: 'Inter, system-ui, sans-serif',
  'noto-sans-sc': '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
};

export function FunnelPageLayout({ theme, children, slug: _slug }: Props) {
  return (
    <div
      style={{
        '--funnel-primary': theme.primary_color,
        '--funnel-bg': theme.bg_color,
        '--funnel-font': fontMap[theme.font] ?? fontMap.system,
        fontFamily: 'var(--funnel-font)',
        backgroundColor: theme.bg_color,
        minHeight: '100vh',
      } as React.CSSProperties}
    >
      <div className="mx-auto max-w-[640px]">
        {children}
      </div>
      <footer className="py-6 text-center text-xs text-gray-400">
        Powered by <span className="font-medium">NextShift</span>
      </footer>
    </div>
  );
}
