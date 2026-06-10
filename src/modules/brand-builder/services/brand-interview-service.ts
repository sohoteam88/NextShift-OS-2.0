import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getRouterForTenant } from '@/modules/ai/router';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { validateAIOutput } from '@/modules/ai/prompt/validator';
import type { AuthUser } from '@/modules/auth/services/auth-service';

const EXTRACTION_SYSTEM_PROMPT = `You are a social media brand consultant specializing in the Malaysian market.
Analyze the following self-introduction and extract a complete brand profile.
The person is a beginner who wants to build their social media presence on Facebook and/or Instagram.

Return ONLY valid JSON with this structure:
{
  "identity": "Their core identity in 1 line (e.g., '全职妈妈 + 营养顾问')",
  "expertise": ["area1", "area2", "area3"],
  "story": "Their core story in 2-3 sentences",
  "audience": "Blueprint audience field: who they want to help",
  "positioning": "Clear one-sentence brand positioning",
  "content_direction": "Content direction based on their story, expertise, and audience",
  "target_audience": "Who they want to help",
  "audience_pain_points": ["pain1", "pain2", "pain3"],
  "personality": "friendly | professional | inspirational | humorous",
  "visual_style": "bright | minimal | warm | bold",
  "value_proposition": "One-sentence value statement",
  "differentiator": "What makes them unique",
  "content_pillars": [
    {"name": "Pillar name", "emoji": "🥗", "percentage": 40, "description": "Brief description"},
    {"name": "Pillar name", "emoji": "📖", "percentage": 20, "description": "Brief description"},
    {"name": "Pillar name", "emoji": "🏆", "percentage": 20, "description": "Brief description"},
    {"name": "Pillar name", "emoji": "💡", "percentage": 10, "description": "Brief description"},
    {"name": "Pillar name", "emoji": "🎁", "percentage": 10, "description": "Brief description"}
  ],
  "social_media_readiness": "beginner | some_experience | experienced",
  "recommended_platforms": ["facebook", "instagram"],
  "recommended_frequency": "daily | every_other_day | 3_per_week",
  "recommended_format": "text_image | video_first | mixed"
}

If information is not mentioned, make a reasonable inference based on context. Do NOT leave fields empty.
Respond in the same language as the input.`;

const DIALOGUE_KEY = '__dialogue';
const SOFT_TURN_LIMIT = 8;
const HARD_TURN_LIMIT = 12;

type SlotStatus = 'empty' | 'partial' | 'filled' | 'skipped';
type SlotName =
  | 'current_occupation'
  | 'previous_experience'
  | 'hidden_expertise'
  | 'preferred_audience'
  | 'future_goal'
  | 'personal_story';

type DialogueMessage = {
  role: 'ai' | 'user';
  type: 'text' | 'voice';
  content: string;
  audio_url?: string;
  ts: string;
};

type DialogueSlot = {
  value: string;
  status: SlotStatus;
};

type DialogueState = {
  messages: DialogueMessage[];
  slots: Record<SlotName, DialogueSlot>;
  turn_count: number;
  next_focus: SlotName;
  stuck_counts: Partial<Record<SlotName, number>>;
  ended_by?: 'ai' | 'user' | 'hardcap';
  analysis?: Record<string, unknown>;
};

type DialogueAIResponse = {
  reply: string;
  slot_updates?: Partial<Record<SlotName, Partial<DialogueSlot>>>;
  next_focus?: SlotName;
  is_complete?: boolean;
  completion_reason?: string | null;
};

const SLOT_NAMES: SlotName[] = [
  'current_occupation',
  'previous_experience',
  'hidden_expertise',
  'preferred_audience',
  'future_goal',
  'personal_story',
];

const EMPTY_SLOTS = SLOT_NAMES.reduce((acc, slot) => {
  acc[slot] = { value: '', status: 'empty' };
  return acc;
}, {} as Record<SlotName, DialogueSlot>);

const DIALOGUE_SYSTEM_PROMPT = `你是 NextShift 的品牌发现教练，正在跟一位完全不懂经营个人品牌的新手聊天。
目标：在轻松的对话里，自然收集以下 6 个槽位的信息，不要像问卷一样一条条念。

槽位：
1 current_occupation 现在做什么
2 previous_experience 过往经历
3 hidden_expertise 别人最常找他帮的事（最重要，多挖一两轮）
4 preferred_audience 想帮的人群
5 future_goal 未来一年想要什么
6 personal_story 最有成就感的事（要有画面感）

规则：
- 用马来西亚中文口语，温暖、像朋友，不要太正式。
- 每次只问一个问题，先对用户上一句给一句真诚的回应/鼓励，再自然带出下一个问题。
- 绝不问「你擅长什么」，改用「别人最常来问你什么」反向挖掘。
- 用户说不知道/想不到，不要重复问，换更小更具体的切入点；连续两次卡住就换话题。
- AI 优先深挖 hidden_expertise 和 personal_story。
- 当 current_occupation / hidden_expertise / preferred_audience / personal_story 都至少有内容，且 hidden_expertise 和 personal_story 至少一个比较具体时，可以收尾。
- 每轮只输出 JSON：{reply, slot_updates, next_focus, is_complete, completion_reason}
- reply 是唯一给用户看的内容，控制在 2-3 句。`;

function getAnswersObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function normalizeSlot(value: unknown): DialogueSlot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { value: '', status: 'empty' };
  const raw = value as Record<string, unknown>;
  const status = raw.status === 'partial' || raw.status === 'filled' || raw.status === 'skipped' ? raw.status : 'empty';
  return {
    value: typeof raw.value === 'string' ? raw.value : '',
    status,
  };
}

function createDialogueState(opening?: string): DialogueState {
  return {
    messages: opening
      ? [{ role: 'ai', type: 'text', content: opening, ts: new Date().toISOString() }]
      : [],
    slots: JSON.parse(JSON.stringify(EMPTY_SLOTS)) as Record<SlotName, DialogueSlot>,
    turn_count: 0,
    next_focus: 'current_occupation',
    stuck_counts: {},
  };
}

function getDialogueState(answers: Record<string, unknown>, opening?: string): DialogueState {
  const raw = answers[DIALOGUE_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return createDialogueState(opening);

  const candidate = raw as Record<string, unknown>;
  const rawSlots = candidate.slots && typeof candidate.slots === 'object' && !Array.isArray(candidate.slots)
    ? candidate.slots as Record<string, unknown>
    : {};
  const slots = SLOT_NAMES.reduce((acc, slot) => {
    acc[slot] = normalizeSlot(rawSlots[slot]);
    return acc;
  }, {} as Record<SlotName, DialogueSlot>);

  const messages = Array.isArray(candidate.messages)
    ? candidate.messages.filter((message): message is DialogueMessage => {
        if (!message || typeof message !== 'object' || Array.isArray(message)) return false;
        const item = message as Record<string, unknown>;
        return (item.role === 'ai' || item.role === 'user') && typeof item.content === 'string';
      })
    : [];

  return {
    messages,
    slots,
    turn_count: typeof candidate.turn_count === 'number' ? candidate.turn_count : 0,
    next_focus: SLOT_NAMES.includes(candidate.next_focus as SlotName) ? candidate.next_focus as SlotName : 'current_occupation',
    stuck_counts: candidate.stuck_counts && typeof candidate.stuck_counts === 'object' && !Array.isArray(candidate.stuck_counts)
      ? candidate.stuck_counts as Partial<Record<SlotName, number>>
      : {},
    ended_by: candidate.ended_by === 'ai' || candidate.ended_by === 'user' || candidate.ended_by === 'hardcap'
      ? candidate.ended_by
      : undefined,
    analysis: candidate.analysis && typeof candidate.analysis === 'object' && !Array.isArray(candidate.analysis)
      ? candidate.analysis as Record<string, unknown>
      : undefined,
  };
}

function saveDialogueState(answers: Record<string, unknown>, state: DialogueState): Prisma.InputJsonValue {
  return {
    ...answers,
    [DIALOGUE_KEY]: state,
  } as Prisma.InputJsonValue;
}

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('AI returned invalid JSON');
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function parseDialogueResponse(text: string): DialogueAIResponse {
  try {
    const parsed = parseJsonObject(text);
    return {
      reply: typeof parsed.reply === 'string' && parsed.reply.trim()
        ? parsed.reply.trim()
        : '我明白了，我们继续慢慢整理。可以再跟我说多一点吗？',
      slot_updates: parsed.slot_updates && typeof parsed.slot_updates === 'object' && !Array.isArray(parsed.slot_updates)
        ? parsed.slot_updates as DialogueAIResponse['slot_updates']
        : {},
      next_focus: SLOT_NAMES.includes(parsed.next_focus as SlotName) ? parsed.next_focus as SlotName : undefined,
      is_complete: parsed.is_complete === true,
      completion_reason: typeof parsed.completion_reason === 'string' ? parsed.completion_reason : null,
    };
  } catch {
    return {
      reply: '我明白了，这个方向有线索了。身边的人通常会因为什么事情来问你意见？',
      slot_updates: {},
      next_focus: 'hidden_expertise',
      is_complete: false,
      completion_reason: null,
    };
  }
}

function mergeSlotUpdates(state: DialogueState, updates: DialogueAIResponse['slot_updates']) {
  if (!updates) return;
  for (const slot of SLOT_NAMES) {
    const update = updates[slot];
    if (!update) continue;
    const value = typeof update.value === 'string' ? update.value.trim() : state.slots[slot].value;
    const status = update.status === 'partial' || update.status === 'filled' || update.status === 'skipped'
      ? update.status
      : value
        ? state.slots[slot].status === 'empty' ? 'partial' : state.slots[slot].status
        : state.slots[slot].status;
    state.slots[slot] = { value, status };
  }
}

function isStuckMessage(message: string) {
  return /不知道|不懂|没想|沒想|想不到|不清楚|随便|隨便|没有|沒有/.test(message);
}

function shouldCompleteBySlots(state: DialogueState) {
  const required = ['current_occupation', 'hidden_expertise', 'preferred_audience', 'personal_story'] as SlotName[];
  const hasRequired = required.every((slot) => state.slots[slot].status === 'partial' || state.slots[slot].status === 'filled');
  const hasCore = state.slots.hidden_expertise.status === 'filled' || state.slots.personal_story.status === 'filled';
  return hasRequired && hasCore;
}

function dialogueToText(state: DialogueState) {
  const slots = SLOT_NAMES.map((slot) => `${slot}: ${state.slots[slot].value || '(empty)'} [${state.slots[slot].status}]`).join('\n');
  const transcript = state.messages.map((message) => `${message.role}: ${message.content}`).join('\n');
  return `Slots:\n${slots}\n\nDialogue:\n${transcript}`;
}

export const brandInterviewService = {
  async create(user: AuthUser, mode: 'voice' | 'text' | 'dialogue', opening?: string) {
    const answers = mode === 'dialogue' ? saveDialogueState({}, createDialogueState(opening)) : {};
    return prisma.brandInterview.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        mode,
        answers,
        status: 'in_progress',
      },
    });
  },

  async saveAnswer(interviewId: string, questionId: string, answer: string) {
    const interview = await prisma.brandInterview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new Error('Interview not found');

    const answers = (interview.answers as Record<string, string>) ?? {};
    answers[questionId] = answer;

    return prisma.brandInterview.update({
      where: { id: interviewId },
      data: { answers },
    });
  },

  async linkVoiceProfile(interviewId: string, voiceProfileId: string) {
    return prisma.brandInterview.update({
      where: { id: interviewId },
      data: { voiceProfileId },
    });
  },

  async extractBrandProfile(interviewId: string, user: AuthUser) {
    await enforceQuota(user.tenantId);

    const interview = await prisma.brandInterview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new Error('Interview not found');

    let inputText = '';
    const answersObject = getAnswersObject(interview.answers);
    const dialogueState = getDialogueState(answersObject);
    if (dialogueState.messages.length > 0) {
      inputText = dialogueToText(dialogueState);
    } else if (interview.mode === 'voice' && interview.voiceProfileId) {
      const voiceProfile = await prisma.voiceProfile.findUnique({
        where: { id: interview.voiceProfileId },
      });
      inputText = voiceProfile?.transcript ?? '';
    } else {
      const answers = interview.answers as Record<string, string>;
      inputText = Object.entries(answers)
        .filter(([qId]) => qId !== DIALOGUE_KEY)
        .map(([qId, answer]) => `${qId}: ${answer}`)
        .join('\n');
    }

    if (!inputText.trim()) throw new Error('No interview data to extract from');

    const router = await getRouterForTenant(user.tenantId);
    const result = await router.generate(
      {
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Interview data:\n${inputText}`,
        temperature: 0.5,
        maxTokens: 1500,
      },
      dialogueState.messages.length > 0 ? 'interview_analysis' : 'brand_extraction',
    );

    let extracted: Record<string, unknown>;
    try {
      const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      extracted = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      extracted = { raw_text: result.text, parse_error: true };
    }

    validateAIOutput(JSON.stringify(extracted));

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'brand_interview_extraction',
      result,
      routing: result.routing,
    });

    const updateData: Prisma.BrandInterviewUpdateInput = {
      extractedProfile: extracted as Prisma.InputJsonValue,
      status: 'extracted',
    };
    if (dialogueState.messages.length > 0) {
      updateData.answers = saveDialogueState(answersObject, { ...dialogueState, analysis: extracted });
    }

    await prisma.brandInterview.update({
      where: { id: interviewId },
      data: updateData,
    });

    return extracted;
  },

  async sendDialogueMessage(
    interviewId: string,
    user: AuthUser,
    input: { content: string; type?: 'text' | 'voice'; audioUrl?: string },
  ) {
    await enforceQuota(user.tenantId);

    const interview = await prisma.brandInterview.findFirst({
      where: { id: interviewId, tenantId: user.tenantId, userId: user.id },
    });
    if (!interview) throw new Error('Interview not found');

    const content = input.content.trim();
    if (!content) throw new Error('Message cannot be empty');

    const answers = getAnswersObject(interview.answers);
    const state = getDialogueState(answers);
    const now = new Date().toISOString();
    const focusedSlot = state.next_focus;

    state.messages.push({
      role: 'user',
      type: input.type ?? 'text',
      content,
      audio_url: input.audioUrl,
      ts: now,
    });
    state.turn_count += 1;

    if (isStuckMessage(content)) {
      const nextCount = (state.stuck_counts[focusedSlot] ?? 0) + 1;
      state.stuck_counts[focusedSlot] = nextCount;
      if (nextCount >= 2) {
        state.slots[focusedSlot] = { ...state.slots[focusedSlot], status: state.slots[focusedSlot].value ? 'partial' : 'skipped' };
      }
    }

    const hardCap = state.turn_count >= HARD_TURN_LIMIT;
    let ai: DialogueAIResponse = {
      reply: hardCap
        ? '我们先到这里就可以了，我已经有足够资料帮你整理方向。'
        : '我明白了。我们换个角度聊，你身边的人最近最常问你什么问题？',
      next_focus: state.next_focus,
      is_complete: hardCap,
      completion_reason: hardCap ? 'hardcap' : null,
    };

    if (!hardCap) {
      const router = await getRouterForTenant(user.tenantId, { mode: 'zh_optimized' });
      const result = await router.generate(
        {
          systemPrompt: DIALOGUE_SYSTEM_PROMPT,
          userMessage: JSON.stringify({
            messages: state.messages,
            slots: state.slots,
            turn_count: state.turn_count,
            stuck_counts: state.stuck_counts,
            latest_user_message: content,
          }),
          temperature: 0.55,
          maxTokens: 700,
        },
        'interview_dialogue',
      );

      ai = parseDialogueResponse(result.text);
      await logAIUsage({
        tenantId: user.tenantId,
        userId: user.id,
        feature: 'brand_interview_dialogue',
        result,
        routing: result.routing,
      });
    }

    mergeSlotUpdates(state, ai.slot_updates);
    if (ai.next_focus) state.next_focus = ai.next_focus;

    if (state.turn_count >= SOFT_TURN_LIMIT && !ai.is_complete && shouldCompleteBySlots(state)) {
      ai.is_complete = true;
      ai.completion_reason = 'soft_wrap';
      ai.reply = '聊得差不多啦，我已经抓到你的重点了。接下来我帮你整理成清楚的品牌方向。';
    }
    if (hardCap) {
      state.ended_by = 'hardcap';
    } else if (ai.is_complete) {
      state.ended_by = 'ai';
    }

    state.messages.push({
      role: 'ai',
      type: 'text',
      content: ai.reply,
      ts: new Date().toISOString(),
    });

    const updated = await prisma.brandInterview.update({
      where: { id: interviewId },
      data: {
        answers: saveDialogueState(answers, state),
        status: ai.is_complete ? 'ready_for_analysis' : 'in_progress',
      },
    });

    return {
      interview: updated,
      dialogue: state,
      reply: ai.reply,
      is_complete: Boolean(ai.is_complete),
      completion_reason: ai.completion_reason,
    };
  },

  async finishDialogue(interviewId: string, user: AuthUser, endedBy: 'ai' | 'user' | 'hardcap' = 'user') {
    const interview = await prisma.brandInterview.findFirst({
      where: { id: interviewId, tenantId: user.tenantId, userId: user.id },
    });
    if (!interview) throw new Error('Interview not found');

    const answers = getAnswersObject(interview.answers);
    const state = getDialogueState(answers);
    state.ended_by = endedBy;

    await prisma.brandInterview.update({
      where: { id: interviewId },
      data: {
        answers: saveDialogueState(answers, state),
        status: 'analyzing',
      },
    });

    return this.extractBrandProfile(interviewId, user);
  },

  async confirmProfile(interviewId: string, user: AuthUser, editedProfile: Record<string, unknown>) {
    await prisma.brandInterview.update({
      where: { id: interviewId },
      data: { extractedProfile: editedProfile as Prisma.InputJsonValue, status: 'confirmed' },
    });

    const existingMeta =
      ((
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { metadata: true },
        })
      )?.metadata as Record<string, unknown>) ?? {};

    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...existingMeta,
          brand_profile: {
            ...editedProfile,
            builder_completed: false,
            interview_id: interviewId,
          },
        } as Prisma.InputJsonValue,
      },
    });

    return editedProfile;
  },

  async getInterview(interviewId: string, tenantId: string) {
    return prisma.brandInterview.findFirst({
      where: { id: interviewId, tenantId },
    });
  },

  async getUserLatestInterview(userId: string, tenantId: string) {
    return prisma.brandInterview.findFirst({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
