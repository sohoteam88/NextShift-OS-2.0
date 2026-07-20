import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetDeleteSchema, leadMagnetPatchSchema } from '@/modules/lead-magnet/input';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const [data, trackLeadMagnets] = await Promise.all([
    leadMagnetService.get(user.id),
    leadMagnetService.getTracks(user.id),
  ]);
  return NextResponse.json({ data, trackLeadMagnets });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const { id, track, ...patch } = leadMagnetPatchSchema.parse(await request.json());
  return NextResponse.json({ data: await leadMagnetService.updateTrack(user.id, track, id, patch) });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = leadMagnetDeleteSchema.parse(await request.json());
  return NextResponse.json({ data: await leadMagnetService.deleteTrack(user.id, input.track, input.id) });
});
