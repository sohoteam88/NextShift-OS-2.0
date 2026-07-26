import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('VideoPage', () => {
  it('renders the canonical video flow for the production view', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/(auth)/video/page.tsx'), 'utf8');

    expect(source).toContain("import { VideoProductionFlow } from '@/modules/video/components/VideoProductionFlow';");
    expect(source).toContain("activeView === 'production' ? <VideoProductionFlow /> : <VideoProjectsList />");
    expect(source).not.toContain('VideoProductionDashboard');
  });
});
