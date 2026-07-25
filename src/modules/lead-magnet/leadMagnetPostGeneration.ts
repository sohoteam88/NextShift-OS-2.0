import type {
  ChecklistItem,
  LeadMagnetConfig,
  LeadMagnetSection,
} from './types';

export const LEAD_MAGNET_JSON_SYSTEM_INSTRUCTION = [
  '【Lead Magnet 输出契约】',
  '只返回合法 JSON，不要 Markdown、代码围栏、解释或额外文字。',
  '必须返回 title、promise、landingPage、cta，以及与输入模板相同的 sections 或 checklistItems。',
  'landingPage 必须含 headline、subheadline、painBullets、mechanism、benefitBullets、formTitle、ctaText；cta 必须含 headline、buttonText、description、whatsappCta、funnelCta。',
  '所有文案必须是非空字符串；列表必须是非空字符串数组。避免收入承诺、医疗或体重效果承诺、公开价格和夸大保证。',
].join('\n');

export function buildLeadMagnetUserMessage(input: {
  type: LeadMagnetConfig['type'];
  track: NonNullable<LeadMagnetConfig['track']>;
  fallback: LeadMagnetConfig;
}): string {
  return [
    `为${input.track === 'retail' ? '零售客户' : '合作伙伴招募'}模式重写一份 ${input.type} 引流资源。`,
    '保留输入模板的 JSON 结构和列表项目数量，只改写面向公众的文案。',
    '标题必须是自然、简短、可读的标题，不能暴露内部变量、整段受众描述或占位词。',
    '使用品牌上下文中的受众、痛点、定位和语气；资料不足时用自然的中性表达。',
    `请返回与此骨架相同的字段：${JSON.stringify(publicSkeleton(input.fallback))}`,
  ].join('\n');
}

export function parseGeneratedLeadMagnet(text: string, fallback: LeadMagnetConfig): LeadMagnetConfig {
  const value = parseObject(text, 'lead magnet');
  const title = requiredString(value.title, 'title');
  const promise = requiredString(value.promise, 'promise');
  const landing = requiredObject(value.landingPage, 'landingPage');
  const cta = requiredObject(value.cta, 'cta');
  const landingPage = {
    ...fallback.landingPage!,
    headline: requiredString(landing.headline, 'landingPage.headline'),
    subheadline: requiredString(landing.subheadline, 'landingPage.subheadline'),
    painBullets: requiredStrings(landing.painBullets, 'landingPage.painBullets'),
    mechanism: requiredString(landing.mechanism, 'landingPage.mechanism'),
    benefitBullets: requiredStrings(landing.benefitBullets, 'landingPage.benefitBullets'),
    formTitle: requiredString(landing.formTitle, 'landingPage.formTitle'),
    ctaText: requiredString(landing.ctaText, 'landingPage.ctaText'),
  };
  const nextCta = {
    ...fallback.cta,
    headline: requiredString(cta.headline, 'cta.headline'),
    buttonText: requiredString(cta.buttonText, 'cta.buttonText'),
    description: requiredString(cta.description, 'cta.description'),
    whatsappCta: requiredString(cta.whatsappCta, 'cta.whatsappCta'),
    funnelCta: requiredString(cta.funnelCta, 'cta.funnelCta'),
  };

  const next: LeadMagnetConfig = {
    ...fallback,
    title,
    promise,
    description: promise,
    landingPage,
    cta: nextCta,
  };
  if (fallback.sections) next.sections = parseSections(value.sections, fallback.sections);
  if (fallback.checklistItems) next.checklistItems = parseChecklist(value.checklistItems, fallback.checklistItems);
  return next;
}

function publicSkeleton(fallback: LeadMagnetConfig) {
  return {
    title: fallback.title,
    promise: fallback.promise,
    landingPage: fallback.landingPage,
    cta: fallback.cta,
    ...(fallback.sections ? { sections: fallback.sections } : {}),
    ...(fallback.checklistItems ? { checklistItems: fallback.checklistItems } : {}),
  };
}

function parseSections(value: unknown, fallback: LeadMagnetSection[]): LeadMagnetSection[] {
  if (!Array.isArray(value) || value.length !== fallback.length) throw new Error('AI lead magnet response sections must match the template length');
  return value.map((item, index) => {
    const section = requiredObject(item, `sections[${index}]`);
    return {
      ...fallback[index],
      title: requiredString(section.title, `sections[${index}].title`),
      body: requiredString(section.body, `sections[${index}].body`),
      bullets: requiredStrings(section.bullets, `sections[${index}].bullets`),
    };
  });
}

function parseChecklist(value: unknown, fallback: ChecklistItem[]): ChecklistItem[] {
  if (!Array.isArray(value) || value.length !== fallback.length) throw new Error('AI lead magnet response checklistItems must match the template length');
  return value.map((item, index) => ({
    ...fallback[index],
    text: requiredString(requiredObject(item, `checklistItems[${index}]`).text, `checklistItems[${index}].text`),
  }));
}

function parseObject(text: string, kind: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`AI ${kind} response did not contain a JSON object`);
  try {
    return requiredObject(JSON.parse(cleaned.slice(start, end + 1)), kind);
  } catch (error) {
    if (error instanceof Error && error.message.includes('must be an object')) throw error;
    throw new Error(`AI ${kind} response contained invalid JSON`);
  }
}

function requiredObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`AI lead magnet response ${field} must be an object`);
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`AI lead magnet response ${field} must be a non-empty string`);
  return value.trim();
}

function requiredStrings(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === 'string' && item.trim())) throw new Error(`AI lead magnet response ${field} must be a non-empty string array`);
  return value.map((item) => (item as string).trim());
}
