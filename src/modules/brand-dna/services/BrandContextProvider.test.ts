import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ default: {} }));

import {
  buildBrandContextPrompt,
  projectBrandContextForTrack,
} from './BrandContextProvider';

const context = {
  brandName: '测试品牌', personalName: 'Lin', positioning: '帮助新手做出清晰选择',
  audience: '零售侧：希望建立健康生活习惯的人；招募侧：想开始创业副业、建立收入的人',
  audiencePainPoints: ['零售侧：担心健康习惯难以坚持与疗效承诺；招募侧：不知道副业如何开始'],
  messaging: { coreMessage: '从小行动开始', uniqueAngle: '清晰步骤', elevatorPitch: '整理下一步' },
  contentPillars: [], offer: { primary: '行动资源', transformation: '从混乱到清晰' }, tone: '真诚直接',
  visualIdentity: { colors: [], imagePrompt: '', bannerPrompt: '' },
};

describe('projectBrandContextForTrack', () => {
  it('reproduces the F-33 dual-track case without cross-track prompt leakage', () => {
    const retailPrompt = buildBrandContextPrompt(context, 'retail');
    const recruitmentPrompt = buildBrandContextPrompt(context, 'recruitment');

    expect(retailPrompt).toContain('健康生活习惯');
    expect(retailPrompt).not.toMatch(/创业|副业|收入/);
    expect(recruitmentPrompt).toContain('副业如何开始');
    expect(recruitmentPrompt).not.toMatch(/疗效|治愈|根治|降三高/);
  });

  it('keeps legacy single-value audience fields visible to both tracks', () => {
    const legacy = { ...context, audience: '希望把日常行动做得更清晰的人', audiencePainPoints: ['不知道从哪里开始'] };
    expect(projectBrandContextForTrack(legacy, 'retail')).toMatchObject({ audience: legacy.audience, audiencePainPoints: legacy.audiencePainPoints });
    expect(projectBrandContextForTrack(legacy, 'recruitment')).toMatchObject({ audience: legacy.audience, audiencePainPoints: legacy.audiencePainPoints });
  });

  it('uses explicit User.metadata track overrides when they are present', () => {
    const projected = projectBrandContextForTrack({
      ...context,
      trackAudience: { recruitment: { targetAudience: '希望了解合作方式的新手', audiencePainPoints: ['不确定怎么开始'] } },
    }, 'recruitment');
    expect(projected).toMatchObject({ audience: '希望了解合作方式的新手', audiencePainPoints: ['不确定怎么开始'] });
  });
});
