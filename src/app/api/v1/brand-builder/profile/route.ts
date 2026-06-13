import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  return NextResponse.json({ data: meta.brand_profile ?? null });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const updates = (await request.json()) as Record<string, unknown>;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const existingMeta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const existingProfile = (existingMeta.brand_profile as Record<string, unknown>) ?? {};

  const newMeta = {
    ...existingMeta,
    brand_profile: { ...existingProfile, ...updates },
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: newMeta as Prisma.InputJsonValue },
  });

  const missionResults = [];
  if (updates.contentStrategy) {
    missionResults.push(await notifyMissionProgress(user, 'positioning_completed'));
  }
  if (updates.bios) {
    missionResults.push(await notifyMissionProgress(user, 'bio_generated'));
  }
  if (updates.avatar_completed || updates.avatarCompleted) {
    missionResults.push(await notifyMissionProgress(user, 'avatar_completed'));
  }

  return NextResponse.json({ data: newMeta.brand_profile, mission: missionResults.find((result) => result.isNewMilestone) ?? missionResults[0] });
});
