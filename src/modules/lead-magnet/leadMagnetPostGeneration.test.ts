import { describe, expect, it } from 'vitest';
import { generateLeadMagnet } from './leadMagnetGenerators';
import { parseGeneratedLeadMagnet } from './leadMagnetPostGeneration';

const brand = {
  brandName: 'NextShift', personalName: 'Lin', positioning: '行动教练', audience: '希望建立行动节奏的新手', audiencePainPoints: ['不知道如何开始'],
  messaging: { coreMessage: '从小行动开始', uniqueAngle: '清晰步骤', elevatorPitch: '整理下一步' }, offer: { primary: '行动资源', transformation: '从混乱到清晰' },
} as never;
const fallback = generateLeadMagnet(brand, 'guide');
const valid = {
  title: '清晰行动启动指南', promise: '用清晰步骤整理适合自己的下一步。',
  landingPage: { headline: '从一个清晰的小行动开始', subheadline: '领取资源，整理你的下一步。', painBullets: ['不知道从哪里开始'], mechanism: '通过简单步骤把想法转成行动。', benefitBullets: ['明确重点', '完成小行动', '建立节奏'], formTitle: '领取资源', ctaText: '领取资源' },
  cta: { headline: '准备好开始了吗？', buttonText: '领取资源', description: '留下联系方式以接收资源。', whatsappCta: '你好，我想领取资源。', funnelCta: '进入领取页' },
  sections: fallback.sections!.map((section, index) => ({ title: `行动步骤 ${index + 1}`, body: '从小行动开始，并按自己的节奏调整。', bullets: ['明确重点', '完成行动', '记录发现'] })),
};

describe('parseGeneratedLeadMagnet', () => {
  it.each(['plain text', '', '{title: invalid}'])('rejects malformed output: %j', (text) => {
    expect(() => parseGeneratedLeadMagnet(text, fallback)).toThrow();
  });

  it.each([
    ['missing title', { ...valid, title: '' }],
    ['missing landing bullets', { ...valid, landingPage: { ...valid.landingPage, painBullets: [] } }],
    ['wrong section length', { ...valid, sections: valid.sections.slice(1) }],
  ])('rejects invalid public field shape: %s', (_name, value) => {
    expect(() => parseGeneratedLeadMagnet(JSON.stringify(value), fallback)).toThrow();
  });

  it('merges valid public copy into the deterministic structural skeleton', () => {
    const result = parseGeneratedLeadMagnet(JSON.stringify(valid), fallback);
    expect(result).toMatchObject({ title: '清晰行动启动指南', promise: valid.promise });
    expect(result.sections?.[0]).toMatchObject({ id: fallback.sections?.[0]?.id, title: '行动步骤 1' });
    expect(result.landingPage?.benefitBullets).toEqual(['明确重点', '完成小行动', '建立节奏']);
  });
});
