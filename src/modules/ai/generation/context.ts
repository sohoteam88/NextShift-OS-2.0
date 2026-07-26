import {
  buildBrandContextPrompt,
  getBrandContext,
  getBrandDnaVersion,
} from '@/modules/brand-dna/services/BrandContextProvider';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type {
  BuildGenerationContextOptions,
  GenerationContext,
  GenerationPlatform,
  PlatformCharacteristics,
} from './types';

export const PLATFORM_CHARACTERISTICS: Record<GenerationPlatform, PlatformCharacteristics> = {
  facebook: {
    platform: 'facebook',
    label: 'Facebook',
    styleGuidance: '用自然、可信、能引发讨论的语气写作，优先建立关系与信任。',
    formatGuidance: '使用易扫读的短段落，并在结尾给出低摩擦互动引导。',
  },
  instagram: {
    platform: 'instagram',
    label: 'Instagram',
    styleGuidance: '用简洁、视觉化、具个人感的表达，第一句快速传递价值。',
    formatGuidance: '适合短段落与明确 caption，兼顾可保存与可分享性。',
  },
  tiktok: {
    platform: 'tiktok',
    label: 'TikTok',
    styleGuidance: '节奏直接、有口语感，快速制造好奇或共鸣。',
    formatGuidance: '以强 hook 开场，使用短句，并保持单一清晰行动目标。',
  },
  xhs: {
    platform: 'xhs',
    label: '小红书',
    styleGuidance: '提供真诚、具体、可实践的经验价值，避免空泛承诺。',
    formatGuidance: '用清晰标题、步骤或清单组织内容，强调可收藏的实用性。',
  },
  threads: {
    platform: 'threads',
    label: 'Threads',
    styleGuidance: '像与熟人交流一样简短、真实、有观点。',
    formatGuidance: '聚焦一个观点或问题，为评论互动留下空间。',
  },
  email: {
    platform: 'email',
    label: 'Email',
    styleGuidance: '清楚、贴近收件人，并以信任为先。',
    formatGuidance: '使用明确主题、短段落与单一主要行动号召。',
  },
  blog: {
    platform: 'blog',
    label: 'Blog',
    styleGuidance: '以专业、深入、易理解的方式展开论点。',
    formatGuidance: '使用有层次的标题、例子与可执行结论。',
  },
};

const MODE_CONTENT_DIRECTION = {
  retail: '零售模式：帮助潜在客户理解问题、获得实用价值，并自然地走向合适的下一步。',
  recruitment: '招募模式：帮助潜在伙伴理解机会、建立信任，并清楚认识下一步的参与方式。',
} as const;

export async function buildGenerationContext(
  user: Pick<AuthUser, 'id'>,
  options: BuildGenerationContextOptions,
): Promise<GenerationContext> {
  const [brandContext, brandDnaVersion] = await Promise.all([
    getBrandContext(user.id),
    getBrandDnaVersion(user.id),
  ]);

  return {
    brandContext,
    brandDnaVersion,
    mode: options.mode,
    platform: PLATFORM_CHARACTERISTICS[options.platform],
    businessPack: options.businessPack,
  };
}

/** Builds the shared system prompt without reimplementing the Brand DNA prompt. */
export function composeGenerationSystemPrompt(context: GenerationContext): string {
  const brandPrompt = context.brandContext
    ? buildBrandContextPrompt(context.brandContext, context.mode)
    : '';
  const businessPackPrompt = context.businessPack?.promptContext?.trim()
    ? `【事业包上下文】\n${context.businessPack.promptContext.trim()}`
    : '';

  return [
    brandPrompt,
    `【品牌 DNA 版本】${context.brandDnaVersion}`,
    `【生成模式】${MODE_CONTENT_DIRECTION[context.mode]}`,
    [
      `【平台写作风格 — ${context.platform.label}】`,
      context.platform.styleGuidance,
      context.platform.formatGuidance,
    ].join('\n'),
    businessPackPrompt,
  ].filter(Boolean).join('\n\n');
}
