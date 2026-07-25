import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(
  new URL('./LeadMagnetDashboard.tsx', import.meta.url),
  'utf8',
);

describe('LeadMagnetDashboard Brand DNA quality state', () => {
  it('keeps lead-magnet generation reachable for an incomplete profile', () => {
    expect(dashboardSource).toContain('资料越全，成品越像你。');
    expect(dashboardSource).toContain(
      '现在就能生成引流资源；补充 Brand DNA 后会更贴合你的受众和方向。',
    );
    expect(dashboardSource).toContain('生成引流资源');
    expect(dashboardSource).toContain('<GenerationQualityNotice');
    expect(dashboardSource).not.toContain('ReadinessGate');
    expect(dashboardSource).not.toContain('引流资源还不能生成。');
    expect(dashboardSource).not.toContain('if (!brandReady || !contentReady)');
  });
});
