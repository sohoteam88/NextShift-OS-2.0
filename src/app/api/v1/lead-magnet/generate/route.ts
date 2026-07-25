import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

const Schema = z.object({
  type: z.enum(['guide', 'checklist', 'template']),
  track: z.enum(['retail', 'recruitment']).default('retail'),
  workspaceId: z.string().optional(),
});

const BatchSchema = z.object({
  requests: z.array(Schema).min(1).max(10),
}).refine(
  ({ requests }) => new Set(requests.map((request) => request.track)).size === requests.length,
  { message: 'Each lead-magnet track can only be generated once per batch.' },
);

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const batch = BatchSchema.safeParse(body);
  const inputs = batch.success ? batch.data.requests : [Schema.parse(body)];
  // Reserve every job before generation so a dual-track run cannot stop halfway
  // solely because the user reached the AI allowance mid-batch.
  await sharedAiRateLimitGuard(user, { feature: 'lead-magnet', cost: inputs.length });
  const generated = await Promise.all(
    inputs.map(async (input) => {
      const workspaceContext = await resolveRequestWorkspaceContext({
        user,
        request,
        body,
        legacyWorkspaceType: input.track,
      });
      return leadMagnetService.generate(
        user.id,
        user.tenantId,
        input.type,
        input.track,
        workspaceContext,
      );
    }),
  );
  if (batch.success) {
    const mission = generated.some((data) => data.qualityScore >= 70)
      ? await notifyMissionProgress(user, 'lead_magnet_created')
      : undefined;
    return NextResponse.json({ data: generated, mission });
  }
  const data = generated[0];
  const mission =
    data.qualityScore >= 70
      ? await notifyMissionProgress(user, 'lead_magnet_created')
      : undefined;
  return NextResponse.json({ data, mission });
});
