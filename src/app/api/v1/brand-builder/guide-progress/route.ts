import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const dynamic = 'force-dynamic';

type StepProgress = {
  steps_done: number[];
  completed: boolean;
  completed_at?: string;
};

type SetupProgress = Record<string, StepProgress>;

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const profile = (meta.brand_profile as Record<string, unknown>) ?? {};
  return NextResponse.json({ data: (profile.setup_progress as SetupProgress) ?? null });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = (await request.json()) as { platform?: string; step?: number; completed?: boolean };

  if (!body.platform || typeof body.step !== 'number') {
    throw new AppError('VALIDATION_ERROR', 400, 'platform and step are required');
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const profile = (meta.brand_profile as Record<string, unknown>) ?? {};
  const existing = ((profile.setup_progress as SetupProgress) ?? {}) as SetupProgress;

  const current: StepProgress = existing[body.platform] ?? { steps_done: [], completed: false };

  let steps_done = [...current.steps_done];
  if (body.completed && !steps_done.includes(body.step)) {
    steps_done = [...steps_done, body.step];
  } else if (!body.completed) {
    steps_done = steps_done.filter((s) => s !== body.step);
  }

  const PLATFORM_TOTAL: Record<string, number> = { facebook: 7, instagram: 6 };
  const total = PLATFORM_TOTAL[body.platform] ?? 7;
  const completed = steps_done.length >= total;

  const updated: StepProgress = {
    steps_done,
    completed,
    completed_at: completed && !current.completed ? new Date().toISOString() : current.completed_at,
  };

  const newMeta = {
    ...meta,
    brand_profile: {
      ...profile,
      setup_progress: { ...existing, [body.platform]: updated },
    },
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: newMeta as Prisma.InputJsonValue },
  });

  const checkKey =
    completed && !current.completed && body.platform === 'facebook'
      ? 'fb_page_completed'
      : completed && !current.completed && body.platform === 'instagram'
        ? 'ig_account_completed'
        : null;
  const mission = checkKey ? await notifyMissionProgress(user, checkKey) : undefined;

  return NextResponse.json({ data: updated, mission });
});
