import type {
  ContentFormat,
  FunnelStage,
  GeneratedPost,
  Platform,
} from './types';

type ContentPillarInput = {
  name: string;
  description: string;
};

const FORMAT_LABELS: Record<ContentFormat, string> = {
  text_post: '图文帖子',
  carousel: '轮播图文',
  reel: '短视频 Reels 文案',
  short_video: '短视频文案',
  story: '限时动态',
  email: '电子邮件',
  blog: '博客文章',
};

const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  awareness: '认知阶段：帮助读者看见问题与价值',
  consideration: '考虑阶段：帮助读者比较方法并建立信任',
  conversion: '行动阶段：清楚说明合适的下一步',
  retention: '留存阶段：帮助现有客户持续获得成果',
};

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  xhs: '小红书',
  threads: 'Threads',
  email: 'Email',
  blog: 'Blog',
};

/** Appended to the shared system prompt through the generation context. */
export const CONTENT_POST_JSON_SYSTEM_INSTRUCTION = [
  '【Content Engine 输出契约】',
  '只返回合法 JSON，不要 Markdown、代码围栏、解释或额外文字。',
  'JSON 必须且只能包含 title、hook、body、cta、hashtags 五个字段；hashtags 必须是字符串数组。',
  'body 必须是有实质内容的完整文案，避免空泛口号、收入承诺和未证实的效果保证。',
].join('\n');

export function buildContentPostUserMessage(input: {
  pillar: ContentPillarInput;
  platform: Platform;
  format: ContentFormat;
  funnelStage: FunnelStage;
}): string {
  return [
    `为 ${PLATFORM_LABELS[input.platform]} 创作一篇${FORMAT_LABELS[input.format]}。`,
    `内容支柱：${input.pillar.name}。`,
    `支柱说明：${input.pillar.description}。`,
    `内容目标：${FUNNEL_STAGE_LABELS[input.funnelStage]}。`,
    '请使用品牌上下文中的真实人设、受众、定位和核心信息；没有明确资料时，写成自然的通用表达，不要展示变量名、占位词或内部枚举值。',
    '正文需有具体观点、可执行建议或可信的个人观察，并使用适合该平台的段落与节奏。',
    '以一个低摩擦、与内容相关的行动号召收尾。',
    '只返回 JSON：{"title":"...","hook":"...","body":"...","cta":"...","hashtags":["#..."]}',
  ].join('\n');
}

/**
 * Extracts the structured post returned by the model. Invalid or incomplete
 * output throws so the shared generation gateway returns its labelled template
 * fallback rather than labelling malformed content as AI output.
 */
export function parseGeneratedPostJson(text: string, fallback: GeneratedPost): GeneratedPost {
  const candidate = extractJsonObject(text);
  if (!candidate) throw new Error('AI content response did not contain a JSON object');

  let value: unknown;
  try {
    value = JSON.parse(candidate);
  } catch {
    throw new Error('AI content response contained invalid JSON');
  }

  if (!value || typeof value !== 'object') {
    throw new Error('AI content response was not a JSON object');
  }

  const post = value as Record<string, unknown>;
  const title = requiredString(post.title, 'title');
  const hook = requiredString(post.hook, 'hook');
  const body = requiredString(post.body, 'body');
  const cta = requiredString(post.cta, 'cta');

  if (body.length < 80) {
    throw new Error('AI content response body was too short');
  }

  if (!Array.isArray(post.hashtags) || !post.hashtags.every((tag) => typeof tag === 'string')) {
    throw new Error('AI content response hashtags must be a string array');
  }

  return {
    ...fallback,
    title,
    hook,
    body,
    cta,
    hashtags: post.hashtags.map((tag) => tag.trim()).filter(Boolean),
  };
}

function extractJsonObject(text: string): string | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  return start === -1 || end === -1 ? null : cleaned.slice(start, end + 1);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`AI content response ${field} must be a non-empty string`);
  }

  return value.trim();
}
