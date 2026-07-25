import { describe, expect, it } from 'vitest';
import { generateFullWebinar } from './webinarGenerators';
import { parseGeneratedWebinar } from './webinarPostGeneration';

const brand = {
  brandName: 'NextShift', personalName: 'Lin', positioning: '行动教练', audience: '希望建立行动节奏的新手', audiencePainPoints: ['不知道如何开始'],
  messaging: { coreMessage: '从小行动开始', uniqueAngle: '清晰步骤', elevatorPitch: '整理下一步' }, offer: { primary: '行动资源', transformation: '从混乱到清晰' },
} as never;
const fallback = generateFullWebinar(brand);
const valid = {
  topic: { title: '用 AI 整理个人品牌行动路径', promise: '用清晰步骤整理适合自己的下一步。', subtitle: '从一个小行动开始。' },
  outline: { ...fallback.outline, opening: '欢迎参加行动路径分享。', story: '今天分享一套清晰、可执行的行动方法。', problem: '很多人不知道从哪里开始。', opportunity: '合适工具能帮助整理行动。', framework: '明确重点、完成行动、定期回顾。', caseStudy: '真实观察显示小行动能够建立节奏。', offer: '如需支持，可了解下一步方式。', qa: '现在可以提出问题。', cta: '领取行动资料。', recommendedDuration: '45 分钟' },
  loomScript: '开场：欢迎参加分享。\n重点：明确重点、完成行动、定期回顾。\n下一步：领取资料。',
  slideOutline: fallback.slideOutline.map((slide, index) => ({ title: `行动步骤 ${index + 1}`, objective: '帮助观众理解行动步骤', keyMessage: '从一个小行动开始。', suggestedVisual: '简单步骤图' })),
  registrationPage: { ...fallback.registrationPage, headline: '用 AI 整理行动路径', subheadline: '领取清晰行动步骤。', bulletPoints: ['明确重点', '完成行动'], benefits: ['获得清晰方向'], cta: '立即注册', urgency: '注册后收到讲座链接。', faq: fallback.registrationPage.faq.map(() => ({ q: '适合谁？', a: '适合希望开始行动的人。' })) },
  replayPage: { headline: '讲座回放', summary: '回顾清晰行动路径。', cta: '领取资料', deadline: '请在方便时观看。' },
  followupSequence: fallback.followupSequence.map((_, index) => ({ label: `行动提醒 ${index + 1}`, message: '选择一个小行动，并记录你的发现。' })),
};

describe('parseGeneratedWebinar', () => {
  it.each(['plain text', '', '{topic: invalid}'])('rejects malformed output: %j', (text) => {
    expect(() => parseGeneratedWebinar(text, fallback)).toThrow();
  });

  it.each([
    ['empty natural title', { ...valid, topic: { ...valid.topic, title: '' } }],
    ['missing registration bullets', { ...valid, registrationPage: { ...valid.registrationPage, bulletPoints: [] } }],
    ['wrong follow-up length', { ...valid, followupSequence: valid.followupSequence.slice(1) }],
  ])('rejects invalid public field shape: %s', (_name, value) => {
    expect(() => parseGeneratedWebinar(JSON.stringify(value), fallback)).toThrow();
  });

  it('keeps structural identifiers while accepting a natural AI-written title', () => {
    const result = parseGeneratedWebinar(JSON.stringify(valid), fallback);
    expect(result.topic.title).toBe('用 AI 整理个人品牌行动路径');
    expect(result.slideOutline[0]).toMatchObject({ slideNumber: fallback.slideOutline[0]?.slideNumber, title: '行动步骤 1' });
    expect(result.followupSequence[0]).toMatchObject({ day: fallback.followupSequence[0]?.day, label: '行动提醒 1' });
  });
});
