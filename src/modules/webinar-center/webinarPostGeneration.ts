import type { FollowupMessage, SlideOutline, WebinarPackage } from './types';

export const WEBINAR_JSON_SYSTEM_INSTRUCTION = [
  '【Webinar Center 输出契约】',
  '只返回合法 JSON，不要 Markdown、代码围栏、解释或额外文字。',
  '必须返回 topic、outline、loomScript、slideOutline、registrationPage、replayPage、followupSequence。保留输入的列表长度与结构，只改写公开文案。',
  'topic.title 必须是自然、简短的讲座标题，不能把整段受众描述直接拼进标题。',
  '所有文案必须是非空字符串；避免收入承诺、医疗或体重效果承诺、公开价格和夸大保证。',
].join('\n');

export function buildWebinarUserMessage(input: { fallback: WebinarPackage; mode: 'retail' | 'recruitment' }): string {
  return [
    `为${input.mode === 'retail' ? '零售客户教育' : '合作伙伴招募教育'}模式创作一套 Webinar 公开文案。`,
    '使用品牌上下文中的真实人设、受众和定位；没有资料时写成自然的中性表达。',
    '保留下列 JSON 骨架的字段、列表长度和 day/slideNumber 等结构数据，仅重写文案字段。',
    `只返回 JSON：${JSON.stringify(publicSkeleton(input.fallback))}`,
  ].join('\n');
}

export function parseGeneratedWebinar(text: string, fallback: WebinarPackage): WebinarPackage {
  const value = parseObject(text);
  const topic = object(value.topic, 'topic');
  const outline = object(value.outline, 'outline');
  const registration = object(value.registrationPage, 'registrationPage');
  const replay = object(value.replayPage, 'replayPage');
  return {
    ...fallback,
    topic: {
      title: string(topic.title, 'topic.title'),
      promise: string(topic.promise, 'topic.promise'),
      subtitle: string(topic.subtitle, 'topic.subtitle'),
    },
    outline: {
      ...fallback.outline,
      opening: string(outline.opening, 'outline.opening'), story: string(outline.story, 'outline.story'),
      problem: string(outline.problem, 'outline.problem'), opportunity: string(outline.opportunity, 'outline.opportunity'),
      framework: string(outline.framework, 'outline.framework'), caseStudy: string(outline.caseStudy, 'outline.caseStudy'),
      offer: string(outline.offer, 'outline.offer'), qa: string(outline.qa, 'outline.qa'),
      cta: string(outline.cta, 'outline.cta'), recommendedDuration: string(outline.recommendedDuration, 'outline.recommendedDuration'),
    },
    loomScript: string(value.loomScript, 'loomScript'),
    slideOutline: slides(value.slideOutline, fallback.slideOutline),
    registrationPage: {
      ...fallback.registrationPage,
      headline: string(registration.headline, 'registrationPage.headline'),
      subheadline: string(registration.subheadline, 'registrationPage.subheadline'),
      bulletPoints: strings(registration.bulletPoints, 'registrationPage.bulletPoints'),
      benefits: strings(registration.benefits, 'registrationPage.benefits'),
      cta: string(registration.cta, 'registrationPage.cta'),
      urgency: string(registration.urgency, 'registrationPage.urgency'),
      faq: faqs(registration.faq, fallback.registrationPage.faq),
    },
    replayPage: {
      ...fallback.replayPage,
      headline: string(replay.headline, 'replayPage.headline'), summary: string(replay.summary, 'replayPage.summary'),
      cta: string(replay.cta, 'replayPage.cta'), deadline: string(replay.deadline, 'replayPage.deadline'),
    },
    followupSequence: followups(value.followupSequence, fallback.followupSequence),
  };
}

function publicSkeleton(fallback: WebinarPackage) {
  return {
    topic: fallback.topic, outline: fallback.outline, loomScript: fallback.loomScript,
    slideOutline: fallback.slideOutline, registrationPage: fallback.registrationPage,
    replayPage: fallback.replayPage, followupSequence: fallback.followupSequence,
  };
}
function slides(value: unknown, fallback: SlideOutline[]): SlideOutline[] {
  if (!Array.isArray(value) || value.length !== fallback.length) throw new Error('AI webinar response slideOutline must match the template length');
  return value.map((item, index) => {
    const slide = object(item, `slideOutline[${index}]`);
    return { ...fallback[index], title: string(slide.title, `slideOutline[${index}].title`), objective: string(slide.objective, `slideOutline[${index}].objective`), keyMessage: string(slide.keyMessage, `slideOutline[${index}].keyMessage`), suggestedVisual: string(slide.suggestedVisual, `slideOutline[${index}].suggestedVisual`) };
  });
}
function followups(value: unknown, fallback: FollowupMessage[]): FollowupMessage[] {
  if (!Array.isArray(value) || value.length !== fallback.length) throw new Error('AI webinar response followupSequence must match the template length');
  return value.map((item, index) => {
    const followup = object(item, `followupSequence[${index}]`);
    return { ...fallback[index], label: string(followup.label, `followupSequence[${index}].label`), message: string(followup.message, `followupSequence[${index}].message`) };
  });
}
function faqs(value: unknown, fallback: WebinarPackage['registrationPage']['faq']) {
  if (!Array.isArray(value) || value.length !== fallback.length) throw new Error('AI webinar response registrationPage.faq must match the template length');
  return value.map((item, index) => {
    const faq = object(item, `registrationPage.faq[${index}]`);
    return { q: string(faq.q, `registrationPage.faq[${index}].q`), a: string(faq.a, `registrationPage.faq[${index}].a`) };
  });
}
function parseObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim(); const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI webinar response did not contain a JSON object');
  try { return object(JSON.parse(cleaned.slice(start, end + 1)), 'webinar'); } catch (error) { if (error instanceof Error && error.message.includes('must be an object')) throw error; throw new Error('AI webinar response contained invalid JSON'); }
}
function object(value: unknown, field: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`AI webinar response ${field} must be an object`); return value as Record<string, unknown>; }
function string(value: unknown, field: string): string { if (typeof value !== 'string' || !value.trim()) throw new Error(`AI webinar response ${field} must be a non-empty string`); return value.trim(); }
function strings(value: unknown, field: string): string[] { if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === 'string' && item.trim())) throw new Error(`AI webinar response ${field} must be a non-empty string array`); return value.map((item) => (item as string).trim()); }
