import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { contentService } from '@/modules/ai/services/content-service';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { generateWithFallback } from '@/modules/ai/providers/factory';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import { funnelTemplateService } from '@/modules/funnel/services/template-service';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import type { BrandPositioning, FirstContentOption, OnboardingState, OnboardingStep } from '../types';

const STEP_ORDER: OnboardingStep[] = ['profile', 'goals', 'brand', 'first_content', 'first_funnel'];

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  current_step: 1,
  completed_steps: [],
};

function normalizeState(value: unknown): OnboardingState {
  const state = (value && typeof value === 'object' ? (value as Partial<OnboardingState>) : {}) ?? {};
  const completedSteps = Array.isArray(state.completed_steps)
    ? state.completed_steps.filter((step): step is OnboardingStep => STEP_ORDER.includes(step as OnboardingStep))
    : [];

  const currentStepFromOrder = STEP_ORDER.findIndex((step) => !completedSteps.includes(step));

  return {
    completed: Boolean(state.completed),
    current_step: state.completed ? STEP_ORDER.length : currentStepFromOrder === -1 ? STEP_ORDER.length : currentStepFromOrder + 1,
    completed_steps: completedSteps,
    completed_at: typeof state.completed_at === 'string' ? state.completed_at : undefined,
  };
}

function normalizeMetadata(metadata: unknown): Prisma.JsonObject {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? ({ ...(metadata as Prisma.JsonObject) } as Prisma.JsonObject)
    : {};
}

function readGoals(metadata: Record<string, unknown>): { health_goals: string[]; target_audience: string; specialty: string } {
  const raw = metadata.goals && typeof metadata.goals === 'object' ? (metadata.goals as Record<string, unknown>) : {};
  return {
    health_goals: Array.isArray(raw.health_goals) ? raw.health_goals.map((item) => String(item)) : [],
    target_audience: typeof raw.target_audience === 'string' ? raw.target_audience : '',
    specialty: typeof raw.specialty === 'string' ? raw.specialty : '',
  };
}

function readBrandPositioning(metadata: Record<string, unknown>): BrandPositioning | null {
  const raw = metadata.brand_positioning;
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.positioning !== 'string') return null;

  return {
    positioning: value.positioning,
    content_pillars: Array.isArray(value.content_pillars) ? value.content_pillars.map((item) => String(item)) : [],
    audience: typeof value.audience === 'string' ? value.audience : undefined,
    why_this_works: typeof value.why_this_works === 'string' ? value.why_this_works : undefined,
  };
}

function readFirstContentOptions(metadata: Record<string, unknown>): FirstContentOption[] {
  const raw = metadata.first_content_options;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const value = item as Record<string, unknown>;
      if (typeof value.title !== 'string' || typeof value.content !== 'string') return null;
      return {
        title: value.title,
        hook: typeof value.hook === 'string' ? value.hook : '',
        content: value.content,
        platform: (value.platform as FirstContentOption['platform']) ?? 'facebook',
      };
    })
    .filter(Boolean) as FirstContentOption[];
}

function buildMetadataPatch(metadata: Prisma.JsonObject, patch: Record<string, unknown>): Prisma.InputJsonValue {
  return {
    ...metadata,
    ...patch,
  } as Prisma.InputJsonValue;
}

function buildBrandPrompt(goals: ReturnType<typeof readGoals>, user: { name: string; bio: string | null }, language: string) {
  return `
You are an onboarding coach. Create concise personal brand positioning in ${language}.

User name: ${user.name}
Bio: ${user.bio ?? ''}
Specialty: ${goals.specialty}
Target audience: ${goals.target_audience}
Health goals: ${goals.health_goals.join(', ')}

Return valid JSON only with:
{
  "positioning": "one sentence brand positioning",
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3"],
  "audience": "short audience summary",
  "why_this_works": "one short explanation"
}
`;
}

function buildContentPrompt(brand: BrandPositioning | null, goals: ReturnType<typeof readGoals>, language: string) {
  return `
You are a social media coach. Generate 3 post ideas in ${language} for a new member onboarding flow.

Brand positioning: ${brand?.positioning ?? 'Not yet defined'}
Content pillars: ${(brand?.content_pillars ?? []).join(', ')}
Audience: ${brand?.audience ?? goals.target_audience}
Specialty: ${goals.specialty}
Goals: ${goals.health_goals.join(', ')}

Return valid JSON only with:
{
  "options": [
    { "title": "short title", "hook": "short hook", "content": "full post text", "platform": "facebook" }
  ]
}
`;
}

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function defaultBrandPositioning(goals: ReturnType<typeof readGoals>, userName: string): BrandPositioning {
  const audience = goals.target_audience || '目标受众';
  const specialty = goals.specialty || '健康管理';
  return {
    positioning: `帮助${audience}通过${specialty}实现更健康、更可持续的改变`,
    content_pillars: ['实用知识', '真实案例', '行动建议'],
    audience,
    why_this_works: `${userName} 的专业背景与受众痛点直接对应，容易建立信任。`,
  };
}

function defaultContentOptions(brand: BrandPositioning | null, language: string): FirstContentOption[] {
  const positioning = brand?.positioning ?? '帮助更多人建立更健康的生活方式';
  return [
    {
      title: '自我介绍',
      hook: '你可以先让别人知道你是谁、擅长什么。',
      content: `${positioning}。\n\n今天先从自我介绍开始：我是一个专注帮助他人建立更健康习惯的人，我会持续分享实用、可执行的建议。`,
      platform: 'facebook',
    },
    {
      title: '价值教学',
      hook: '用一个小知识点建立专业感。',
      content: `今天想分享一个简单但重要的观点：${positioning} 并不需要复杂的方法，关键是从今天开始做出一个小改变。`,
      platform: 'facebook',
    },
    {
      title: '行动号召',
      hook: '给受众一个很容易开始的下一步。',
      content: `如果你也希望更系统地改善状态，可以先收藏这篇内容。接下来我会持续分享更多 ${language === 'zh' ? '中文' : '本地语言'} 的实用建议。`,
      platform: 'facebook',
    },
  ];
}

export const onboardingService = {
  async getState(userId: string): Promise<OnboardingState> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    const metadata = normalizeMetadata(user?.metadata);
    return normalizeState(metadata.onboarding ?? DEFAULT_STATE);
  },

  async getOverview(userId: string) {
    const user = await this.getUserContext(userId);
    const metadata = normalizeMetadata(user.metadata);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        languagePreference: user.languagePreference,
      },
      state: normalizeState(metadata.onboarding ?? DEFAULT_STATE),
      profile: {
        phone: user.phone ?? '',
        whatsapp: typeof metadata.whatsapp === 'string' ? metadata.whatsapp : user.phone ?? '',
        bio: user.bio ?? '',
        avatar_url: user.avatarUrl ?? '',
      },
      goals: readGoals(metadata),
      brand_positioning: readBrandPositioning(metadata),
      first_content_options: readFirstContentOptions(metadata),
      first_funnel_id: typeof metadata.first_funnel_id === 'string' ? metadata.first_funnel_id : '',
      first_funnel_template_id:
        typeof metadata.first_funnel_template_id === 'string' ? metadata.first_funnel_template_id : '',
    };
  },

  async getUserContext(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        languagePreference: true,
        metadata: true,
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');
    return user;
  },

  async saveOnboardingState(userId: string, state: OnboardingState) {
    const user = await this.getUserContext(userId);
    const metadata = normalizeMetadata(user.metadata);
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: buildMetadataPatch(metadata, { onboarding: normalizeState(state) }),
      },
    });
    return normalizeState(state);
  },

  async completeStep(userId: string, step: OnboardingStep) {
    const state = await this.getState(userId);
    const nextSteps = state.completed_steps.includes(step)
      ? [...state.completed_steps]
      : [...state.completed_steps, step].filter((item, index, all) => all.indexOf(item) === index);
    const orderedSteps = STEP_ORDER.filter((item) => nextSteps.includes(item));
    const firstIncomplete = STEP_ORDER.findIndex((item) => !orderedSteps.includes(item));
    const completed = orderedSteps.length >= STEP_ORDER.length;

    return this.saveOnboardingState(userId, {
      completed,
      current_step: completed ? STEP_ORDER.length : firstIncomplete === -1 ? STEP_ORDER.length : firstIncomplete + 1,
      completed_steps: orderedSteps,
      completed_at: completed ? new Date().toISOString() : state.completed_at,
    });
  },

  async skipOnboarding(userId: string) {
    const state = await this.getState(userId);
    return this.saveOnboardingState(userId, {
      ...state,
      completed: true,
      current_step: STEP_ORDER.length,
      completed_at: new Date().toISOString(),
    });
  },

  async saveProfile(
    userId: string,
    input: { phone?: string; whatsapp?: string; bio?: string; avatar_url?: string },
  ) {
    const user = await this.getUserContext(userId);
    const metadata = normalizeMetadata(user.metadata);
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: input.phone ?? user.phone,
        avatarUrl: input.avatar_url ?? user.avatarUrl,
        bio: input.bio ?? user.bio,
        metadata: buildMetadataPatch(metadata, {
          whatsapp: input.whatsapp ?? input.phone ?? (metadata.whatsapp as string | undefined) ?? '',
        }),
      },
    });
    return this.completeStep(userId, 'profile');
  },

  async saveGoals(
    userId: string,
    input: { health_goals: string[]; target_audience: string; specialty: string },
  ) {
    const user = await this.getUserContext(userId);
    const metadata = normalizeMetadata(user.metadata);
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: buildMetadataPatch(metadata, {
          goals: {
            health_goals: input.health_goals,
            target_audience: input.target_audience,
            specialty: input.specialty,
          },
          target_audience: input.target_audience,
          specialty: input.specialty,
        }),
      },
    });
    return this.completeStep(userId, 'goals');
  },

  async generateBrandPositioning(userId: string) {
    const user = await this.getUserContext(userId);
    await enforceQuota(user.tenantId);

    const metadata = normalizeMetadata(user.metadata);
    const goals = readGoals(metadata);
    const language = (user.languagePreference as 'zh' | 'en' | 'ms') ?? 'zh';

    const result = await generateWithFallback(
      {
        systemPrompt: 'You are a concise onboarding assistant for a membership platform. Return valid JSON only.',
        userMessage: buildBrandPrompt(goals, { name: user.name, bio: user.bio }, language),
        temperature: 0.4,
        maxTokens: 512,
      },
      undefined,
    );

    let parsed = extractJson(result.text);
    let brand: BrandPositioning | null = parsed
      ? {
          positioning: typeof parsed.positioning === 'string' ? parsed.positioning : '',
          content_pillars: Array.isArray(parsed.content_pillars) ? parsed.content_pillars.map(String) : [],
          audience: typeof parsed.audience === 'string' ? parsed.audience : '',
          why_this_works: typeof parsed.why_this_works === 'string' ? parsed.why_this_works : '',
        }
      : null;

    if (!brand?.positioning) {
      brand = defaultBrandPositioning(goals, user.name);
    }

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'onboarding_brand',
      result,
    });

    return brand ?? defaultBrandPositioning(goals, user.name);
  },

  async saveBrandPositioning(userId: string, brand: BrandPositioning) {
    const user = await this.getUserContext(userId);
    const metadata = normalizeMetadata(user.metadata);
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: buildMetadataPatch(metadata, { brand_positioning: brand }),
      },
    });
    return this.completeStep(userId, 'brand');
  },

  async generateFirstContentOptions(userId: string) {
    const user = await this.getUserContext(userId);
    await enforceQuota(user.tenantId);

    const metadata = normalizeMetadata(user.metadata);
    const goals = readGoals(metadata);
    const brand = readBrandPositioning(metadata);
    const language = (user.languagePreference as 'zh' | 'en' | 'ms') ?? 'zh';

    const result = await generateWithFallback(
      {
        systemPrompt: 'You are a social media coach. Return valid JSON only.',
        userMessage: buildContentPrompt(brand, goals, language),
        temperature: 0.8,
        maxTokens: 900,
      },
      undefined,
    );

    let parsed = extractJson(result.text);
    let options = parsed && Array.isArray(parsed.options) ? parsed.options : null;

    if (!options) {
      options = defaultContentOptions(brand, language);
    } else {
      options = options
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const value = item as Record<string, unknown>;
          if (typeof value.title !== 'string' || typeof value.content !== 'string') return null;
          return {
            title: value.title,
            hook: typeof value.hook === 'string' ? value.hook : '',
            content: value.content,
            platform: (value.platform as FirstContentOption['platform']) ?? 'facebook',
          };
        })
        .filter(Boolean) as FirstContentOption[];
    }

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'onboarding_first_content',
      result,
    });

    return options;
  },

  async saveFirstContent(userId: string, input: { title: string; content: string; platform: string }) {
    const user = await this.getUserContext(userId);
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      preferredLanguage: user.languagePreference,
      status: 'active',
    };

    const content = await contentService.saveContent(authUser, {
      title: input.title,
      content: input.content,
      platform: input.platform,
      status: 'published',
      language: (user.languagePreference as 'zh' | 'en' | 'ms') ?? 'zh',
      promptUsed: 'onboarding_first_content',
    });

    const metadata = normalizeMetadata(user.metadata);
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: buildMetadataPatch(metadata, {
          first_content_id: content.id,
        }),
      },
    });

    await this.completeStep(userId, 'first_content');
    return content;
  },

  async createFirstFunnel(userId: string, input: { template_id: string; whatsapp: string }) {
    const user = await this.getUserContext(userId);
    const template = await funnelTemplateService.getById(user.tenantId, input.template_id);

    const clonedConfig = structuredClone(template.config) as Record<string, unknown>;

    const replaceTargets = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(replaceTargets);
      if (!value || typeof value !== 'object') return value;

      const obj = value as Record<string, unknown>;
      const next: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(obj)) {
        if (key === 'cta_target' || key === 'button_target' || key === 'whatsapp_redirect') {
          next[key] = input.whatsapp.startsWith('http') ? input.whatsapp : `https://wa.me/${input.whatsapp.replace(/\D/g, '')}`;
        } else {
          next[key] = replaceTargets(item);
        }
      }
      return next;
    };

    const config = replaceTargets(clonedConfig) as Prisma.InputJsonValue;

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      preferredLanguage: user.languagePreference,
      status: 'active',
    };

    const funnel = await funnelService.create(authUser, {
      title: `${template.name} · ${user.name}`,
      config: config as Record<string, unknown>,
    });

    const metadata = normalizeMetadata(user.metadata);
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: buildMetadataPatch(metadata, {
          first_funnel_id: funnel.id,
          first_funnel_template_id: template.id,
        }),
      },
    });

    await this.completeStep(userId, 'first_funnel');
    return { funnel, template };
  },
};
