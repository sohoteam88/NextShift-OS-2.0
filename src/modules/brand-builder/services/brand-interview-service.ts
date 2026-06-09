import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generateWithFallback } from '@/modules/ai/providers/factory';
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
  "story": "Their core story in 2-3 sentences",
  "expertise": ["area1", "area2", "area3"],
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

export const brandInterviewService = {
  async create(user: AuthUser, mode: 'voice' | 'text') {
    return prisma.brandInterview.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        mode,
        answers: {},
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
    if (interview.mode === 'voice' && interview.voiceProfileId) {
      const voiceProfile = await prisma.voiceProfile.findUnique({
        where: { id: interview.voiceProfileId },
      });
      inputText = voiceProfile?.transcript ?? '';
    } else {
      const answers = interview.answers as Record<string, string>;
      inputText = Object.entries(answers)
        .map(([qId, answer]) => `${qId}: ${answer}`)
        .join('\n');
    }

    if (!inputText.trim()) throw new Error('No interview data to extract from');

    const result = await generateWithFallback({
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      userMessage: `Interview data:\n${inputText}`,
      temperature: 0.5,
      maxTokens: 1500,
    });

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
    });

    await prisma.brandInterview.update({
      where: { id: interviewId },
      data: { extractedProfile: extracted as Prisma.InputJsonValue, status: 'extracted' },
    });

    return extracted;
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
