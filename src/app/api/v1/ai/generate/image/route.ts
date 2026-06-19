import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { enforceQuota } from '@/modules/ai/usage/quota';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  prompt: z.string().min(5).max(1000),
  style: z.enum(['realistic', 'professional', 'lifestyle', 'illustration', 'minimal']).default('realistic'),
  platform: z.enum(['square', 'landscape', 'portrait']).default('square'),
  enhancePrompt: z.boolean().default(true),
});

const SIZE_MAP: Record<string, '1024x1024' | '1536x1024' | '1024x1536'> = {
  square:    '1024x1024',
  landscape: '1536x1024',
  portrait:  '1024x1536',
};

const STYLE_SUFFIX: Record<string, string> = {
  realistic:     'photorealistic, natural lighting, high quality photography',
  professional:  'professional business photography, clean background, corporate style',
  lifestyle:     'warm lifestyle photography, authentic, relatable, everyday life',
  illustration:  'digital illustration, vibrant colors, modern flat design style',
  minimal:       'minimalist design, clean white background, simple composition',
};

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  await enforceQuota(user.tenantId);

  const body = await request.json();
  const { prompt, style, platform, enhancePrompt } = Schema.parse(body);

  const finalPrompt = enhancePrompt
    ? `${prompt}. Style: ${STYLE_SUFFIX[style]}. For social media use. No text or watermarks.`
    : prompt;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: finalPrompt,
    n: 1,
    size: SIZE_MAP[platform],
    quality: 'high',
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    return NextResponse.json({ error: { message: '图片生成失败，请重试' } }, { status: 500 });
  }
  const imageBase64 = imageData.b64_json;
  const revisedPrompt = finalPrompt;

  // DALL-E 3 HD pricing: ~$0.080/image (landscape/portrait), ~$0.040 (square)
  const costUsd = platform === 'square' ? 0.04 : 0.08;
  await prisma.aIUsageLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      provider: 'openai',
      model: 'dall-e-3',
      category: 'image_generation',
      feature: 'image_generation',
      tokensIn: 0,
      tokensOut: 0,
      durationMs: 0,
      costUsd: new Prisma.Decimal(costUsd.toFixed(6)),
    },
  });

  return NextResponse.json({
    data: {
      imageBase64,
      revisedPrompt,
      platform,
      style,
    },
  });
});
