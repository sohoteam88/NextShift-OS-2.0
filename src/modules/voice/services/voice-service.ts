import OpenAI, { toFile } from 'openai';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { generateWithFallback } from '@/modules/ai/providers/factory';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import type {
  VoiceExtractionData,
  VoiceLanguage,
  VoiceListResult,
  VoiceRecord,
  VoiceReviewUpdateInput,
  VoiceUploadResult,
} from '../types';

const DAILY_LIMIT = 3;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
]);

const voiceExtractionSchema = z.object({
  summary: z.string().min(1),
  pain_points: z.array(z.string()).default([]),
  health_goals: z.array(z.string()).default([]),
  story_angle: z.string().min(1),
  content_pillars: z.array(z.string()).default([]),
  background: z.string().min(1),
  motivation: z.string().min(1),
  preferred_topics: z.array(z.string()).default([]),
  tone: z.string().min(1),
  language: z.enum(['zh', 'en', 'ms']),
  duration_secs: z.number().nonnegative(),
  source_language: z.string().nullable().optional(),
  source_file_name: z.string().nullable().optional(),
});

const languageLabel: Record<VoiceLanguage, string> = {
  zh: 'Chinese',
  en: 'English',
  ms: 'Bahasa Malaysia',
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('INTERNAL_ERROR', 500, 'OPENAI_API_KEY is required for voice transcription.');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
}

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function normalizeJsonObject(value: unknown): Prisma.JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Prisma.JsonObject) };
  }
  return {};
}

function parseExtraction(text: string): VoiceExtractionData | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const result = voiceExtractionSchema.safeParse({
      summary: parsed.summary,
      pain_points: parsed.pain_points,
      health_goals: parsed.health_goals,
      story_angle: parsed.story_angle,
      content_pillars: parsed.content_pillars,
      background: parsed.background,
      motivation: parsed.motivation,
      preferred_topics: parsed.preferred_topics,
      tone: parsed.tone,
      language: parsed.language,
      duration_secs: Number(parsed.duration_secs),
      source_language: parsed.source_language ?? null,
      source_file_name: parsed.source_file_name ?? null,
    });

    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

function parseStoredExtraction(value: Prisma.JsonValue | null): VoiceExtractionData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const result = voiceExtractionSchema.safeParse({
    summary: candidate.summary,
    pain_points: candidate.pain_points,
    health_goals: candidate.health_goals,
    story_angle: candidate.story_angle,
    content_pillars: candidate.content_pillars,
    background: candidate.background,
    motivation: candidate.motivation,
    preferred_topics: candidate.preferred_topics,
    tone: candidate.tone,
    language: candidate.language,
    duration_secs: Number(candidate.duration_secs),
    source_language: candidate.source_language ?? null,
    source_file_name: candidate.source_file_name ?? null,
  });

  return result.success ? result.data : null;
}

function buildPrompt(extras: {
  language: VoiceLanguage;
  transcript: string;
  durationSecs: number;
  fileName: string;
}) {
  const targetLanguage = languageLabel[extras.language];
  return `
You are extracting a creator profile from a spoken voice note.

Return valid JSON only with exactly these keys:
summary, pain_points, health_goals, story_angle, content_pillars, background, motivation, preferred_topics, tone, language, duration_secs, source_language, source_file_name

Rules:
- Write the fields in ${targetLanguage}.
- pain_points, health_goals, content_pillars, preferred_topics must be arrays of short phrases.
- tone must be a short label.
- language must be one of zh, en, ms.
- duration_secs must be a number.
- source_language should reflect the spoken language when detectable, otherwise null.
- source_file_name should be ${JSON.stringify(extras.fileName)}.
- Keep the output grounded in the transcript and do not invent facts.

Transcript:
${extras.transcript}

Duration seconds:
${extras.durationSecs}
`.trim();
}

function toDurationSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
  }
  return null;
}

function getStoragePath(value: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return null;
  }
  return value.replace(/^\/+/, '');
}

function buildVoiceBio(extracted: VoiceExtractionData) {
  const parts = [extracted.summary, extracted.background, extracted.story_angle]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join('\n\n').slice(0, 800);
}

async function getSignedAudioUrl(storagePath: string) {
  if (!storagePath) return '';

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage.from('voice').createSignedUrl(storagePath, 60 * 60);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 500, `Failed to create signed voice URL: ${error.message}`);
  }

  return data.signedUrl;
}

async function getRecordById(tenantId: string, id: string) {
  return prisma.voiceProfile.findFirst({
    where: { id, tenantId },
  });
}

async function getAuthorizedRecord(user: AuthUser, id: string) {
  const record = await getRecordById(user.tenantId, id);
  if (!record) {
    throw new AppError('NOT_FOUND', 404, 'Voice recording not found');
  }

  if (record.userId !== user.id) {
    throw new AppError('FORBIDDEN', 403, 'Voice recording access denied');
  }

  return record;
}

async function mapRecord(record: {
  id: string;
  tenantId: string;
  userId: string;
  audioUrl: string;
  transcript: string | null;
  extractedData: Prisma.JsonValue | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const storagePath = getStoragePath(record.audioUrl) ?? record.audioUrl;
  const previewUrl = record.audioUrl.startsWith('http')
    ? record.audioUrl
    : await getSignedAudioUrl(storagePath);

  const extracted = parseStoredExtraction(record.extractedData);

  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    audioUrl: previewUrl,
    audioPath: storagePath,
    transcript: record.transcript,
    extractedData: extracted,
    status: record.status as VoiceRecord['status'],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    language: extracted?.language ?? 'zh',
    durationSecs: extracted?.duration_secs ?? null,
  } satisfies VoiceRecord;
}

async function transcribeAudio(file: File, language: VoiceLanguage, fileName: string) {
  const client = getOpenAIClient();
  const bytes = await file.arrayBuffer();
  const uploadable = await toFile(bytes, file.name || fileName, { type: file.type || 'audio/webm' });

  const transcription = await client.audio.transcriptions.create({
    file: uploadable,
    model: 'whisper-1',
    response_format: 'verbose_json',
    language,
  });

  return {
    text: transcription.text ?? '',
    language: (transcription as { language?: string }).language ?? language,
    durationSecs: Math.round(
      Number(
        (transcription as { duration?: number; usage?: { seconds?: number } }).duration ??
          (transcription as { usage?: { seconds?: number } }).usage?.seconds ??
          0,
      ) || 0,
    ),
  };
}

async function extractProfile(params: {
  transcript: string;
  language: VoiceLanguage;
  durationSecs: number;
  fileName: string;
}) {
  const prompt = buildPrompt(params);
  const result = await generateWithFallback(
    {
      systemPrompt:
        'You are a voice profile extraction assistant. Return raw JSON only and do not wrap it in markdown.',
      userMessage: prompt,
      temperature: 0.2,
      maxTokens: 1400,
    },
    'anthropic',
  );

  let parsed = parseExtraction(result.text);
  if (!parsed) {
    const retry = await generateWithFallback(
      {
        systemPrompt:
          'You are a voice profile extraction assistant. Return only valid JSON with the requested keys.',
        userMessage: `${prompt}\n\nIMPORTANT: output JSON only.`,
        temperature: 0.1,
        maxTokens: 1400,
      },
      'anthropic',
    );
    parsed = parseExtraction(retry.text);
    result.text = retry.text;
    result.tokensIn += retry.tokensIn;
    result.tokensOut += retry.tokensOut;
    result.durationMs += retry.durationMs;
  }

  if (!parsed) {
    throw new AppError('INTERNAL_ERROR', 500, 'Failed to parse voice profile extraction');
  }

  return { parsed, usage: result };
}

async function logVoiceUsage(params: {
  user: AuthUser;
  templateId?: string;
  result: {
    text: string;
    tokensIn: number;
    tokensOut: number;
    model: string;
    provider: 'anthropic' | 'openai';
    durationMs: number;
  };
}) {
  await logAIUsage({
    tenantId: params.user.tenantId,
    userId: params.user.id,
    templateId: params.templateId,
    feature: 'voice_capture',
    result: params.result,
  });
}

export const voiceService = {
  async getDailyCount(user: AuthUser) {
    return prisma.voiceProfile.count({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
        createdAt: { gte: startOfDay() },
      },
    });
  },

  async listMine(user: AuthUser): Promise<VoiceListResult> {
    const [rows, todayCount, total] = await Promise.all([
      prisma.voiceProfile.findMany({
        where: {
          tenantId: user.tenantId,
          userId: user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.voiceProfile.count({
        where: {
          tenantId: user.tenantId,
          userId: user.id,
          createdAt: { gte: startOfDay() },
        },
      }),
      prisma.voiceProfile.count({
        where: {
          tenantId: user.tenantId,
          userId: user.id,
        },
      }),
    ]);

    return {
      data: await Promise.all(rows.map((row) => mapRecord(row))),
      meta: {
        total,
        todayCount,
        limitPerDay: DAILY_LIMIT,
      },
    };
  },

  async getById(user: AuthUser, id: string) {
    const record = await getAuthorizedRecord(user, id);
    return { data: await mapRecord(record) };
  },

  async upload(user: AuthUser, input: { file: File; language?: VoiceLanguage; durationSecs?: number }) {
    const todayCount = await voiceService.getDailyCount(user);
    if (todayCount >= DAILY_LIMIT) {
      throw new AppError('QUOTA_EXCEEDED', 429, `Voice capture limit reached. You can upload up to ${DAILY_LIMIT} recordings per day.`);
    }

    const file = input.file;
    if (!file) {
      throw new AppError('VALIDATION_ERROR', 400, 'No audio file provided');
    }
    if (file.size > MAX_AUDIO_SIZE) {
      throw new AppError('VALIDATION_ERROR', 400, 'Audio file is too large (max 25MB)');
    }
    const normalizedType = file.type.split(';')[0].trim();
    if (file.type && !ALLOWED_AUDIO_TYPES.has(normalizedType)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Unsupported audio format');
    }

    const language = input.language ?? (user.preferredLanguage as VoiceLanguage) ?? 'zh';
    const fileName = file.name || `voice-${Date.now()}.webm`;
    const storagePath = `voice/${user.tenantId}/${user.id}/${Date.now()}-${fileName}`.replace(/\s+/g, '-');
    const supabase = await createServerSupabaseClient();

    const { error: uploadError } = await supabase.storage.from('voice').upload(storagePath, file, {
      contentType: normalizedType || 'audio/webm',
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      throw new AppError('INTERNAL_ERROR', 500, `Voice upload failed: ${uploadError.message}`);
    }

    let created: { id: string } | null = null;
    try {
      created = await prisma.voiceProfile.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          audioUrl: storagePath,
          transcript: null,
          extractedData: {
            language,
            duration_secs: input.durationSecs ?? 0,
            source_file_name: fileName,
          } as Prisma.InputJsonValue,
          status: 'transcribing',
        },
      });
    } catch (createError) {
      await supabase.storage.from('voice').remove([storagePath]).catch(() => {});
      throw createError;
    }
    if (!created) {
      throw new AppError('INTERNAL_ERROR', 500, 'Failed to create voice profile');
    }

    try {
      const transcript = await transcribeAudio(file, language, fileName);
      await prisma.voiceProfile.update({
        where: { id: created.id },
        data: {
          transcript: transcript.text,
          status: 'extracting',
          extractedData: {
            language,
            duration_secs: input.durationSecs ?? transcript.durationSecs,
            source_language: transcript.language,
            source_file_name: fileName,
          } as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });

      const extraction = await extractProfile({
        transcript: transcript.text,
        language,
        durationSecs: input.durationSecs ?? transcript.durationSecs,
        fileName,
      });

      const extractedData = {
        ...extraction.parsed,
        language,
        duration_secs: input.durationSecs ?? transcript.durationSecs,
        source_language: transcript.language,
        source_file_name: fileName,
      };

      const updated = await prisma.voiceProfile.update({
        where: { id: created.id },
        data: {
          transcript: transcript.text,
          extractedData: extractedData as Prisma.InputJsonValue,
          status: 'review',
          updatedAt: new Date(),
        },
      });

      await logVoiceUsage({
        user,
        result: extraction.usage,
      });

      return { data: await mapRecord(updated) } satisfies VoiceUploadResult;
    } catch (error) {
      await prisma.voiceProfile.update({
        where: { id: created.id },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });
      throw error;
    }
  },

  async update(user: AuthUser, id: string, input: VoiceReviewUpdateInput) {
    const record = await getAuthorizedRecord(user, id);
    const extractedData = normalizeJsonObject(record.extractedData);
    const mergedExtractedData = {
      ...extractedData,
      ...(input.extractedData ?? {}),
    };

    const updated = await prisma.voiceProfile.update({
      where: { id },
      data: {
        transcript: input.transcript ?? record.transcript,
        extractedData: mergedExtractedData as Prisma.InputJsonValue,
        status: input.status ?? 'review',
        updatedAt: new Date(),
      },
    });

    return { data: await mapRecord(updated) };
  },

  async approve(user: AuthUser, id: string) {
    const record = await getAuthorizedRecord(user, id);
    const extracted = parseStoredExtraction(record.extractedData);

    if (!extracted) {
      throw new AppError('VALIDATION_ERROR', 400, 'No extracted voice profile found to approve');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const voice = await tx.voiceProfile.update({
        where: { id },
        data: {
          status: 'approved',
          updatedAt: new Date(),
        },
      });

      const metadata = normalizeJsonObject((await tx.user.findUnique({
        where: { id: user.id },
        select: { metadata: true },
      }))?.metadata);

      await tx.user.update({
        where: { id: user.id },
        data: {
          bio: buildVoiceBio(extracted),
          metadata: {
            ...metadata,
            voiceProfile: {
              id: voice.id,
              approvedAt: new Date().toISOString(),
              summary: extracted.summary,
              pain_points: extracted.pain_points,
              health_goals: extracted.health_goals,
              story_angle: extracted.story_angle,
              content_pillars: extracted.content_pillars,
              background: extracted.background,
              motivation: extracted.motivation,
              preferred_topics: extracted.preferred_topics,
              tone: extracted.tone,
              language: extracted.language,
            },
          } as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });

      return voice;
    });

    return { data: await mapRecord(updated) };
  },

  async retry(user: AuthUser, id: string) {
    const record = await getAuthorizedRecord(user, id);
    const storagePath = getStoragePath(record.audioUrl) ?? record.audioUrl;
    const supabase = await createServerSupabaseClient();

    const { data: downloaded, error } = await supabase.storage.from('voice').download(storagePath);
    if (error || !downloaded) {
      throw new AppError('NOT_FOUND', 404, `Could not load stored voice file: ${error?.message ?? 'missing file'}`);
    }

    const extractedData = parseStoredExtraction(record.extractedData);
    const language = extractedData?.language ?? 'zh';
    const durationSecs = extractedData?.duration_secs ?? 0;
    const fileName = extractedData?.source_file_name ?? `${record.id}.webm`;
    const file = await toFile(await downloaded.arrayBuffer(), fileName, {
      type: downloaded.type || 'audio/webm',
    });

    await prisma.voiceProfile.update({
      where: { id },
      data: {
        status: 'transcribing',
        updatedAt: new Date(),
      },
    });

    try {
      const transcript = await transcribeAudio(file, language, fileName);
      await prisma.voiceProfile.update({
        where: { id },
        data: {
          transcript: transcript.text,
          status: 'extracting',
          updatedAt: new Date(),
        },
      });

      const extraction = await extractProfile({
        transcript: transcript.text,
        language,
        durationSecs: durationSecs || transcript.durationSecs,
        fileName,
      });

      const mergedData = {
        ...extraction.parsed,
        language,
        duration_secs: durationSecs || transcript.durationSecs,
        source_language: transcript.language,
        source_file_name: fileName,
      };

      const updated = await prisma.voiceProfile.update({
        where: { id },
        data: {
          transcript: transcript.text,
          extractedData: mergedData as Prisma.InputJsonValue,
          status: 'review',
          updatedAt: new Date(),
        },
      });

      await logVoiceUsage({
        user,
        result: extraction.usage,
      });

      return { data: await mapRecord(updated) };
    } catch (retryError) {
      await prisma.voiceProfile.update({
        where: { id },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });
      throw retryError;
    }
  },

  async remove(user: AuthUser, id: string) {
    const record = await getAuthorizedRecord(user, id);
    const supabase = await createServerSupabaseClient();
    const storagePath = getStoragePath(record.audioUrl) ?? record.audioUrl;

    const { error } = await supabase.storage.from('voice').remove([storagePath]);
    if (error) {
      throw new AppError('INTERNAL_ERROR', 500, `Failed to delete voice file: ${error.message}`);
    }

    await prisma.voiceProfile.delete({ where: { id } });
    return { data: { id } };
  },
};
