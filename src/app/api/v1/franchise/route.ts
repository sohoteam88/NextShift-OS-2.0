import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { franchiseService } from '@/modules/franchise/franchiseService';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [health, members, blueprints, myAssignment] = await Promise.all([
    franchiseService.getFranchiseHealth(user.id, user.tenantId),
    franchiseService.getTeamMembers(user.id, user.tenantId),
    franchiseService.getBlueprints(user.id),
    franchiseService.getMyAssignment(user.id),
  ]);
  return NextResponse.json({ data: { health, members, blueprints, myAssignment } });
});
