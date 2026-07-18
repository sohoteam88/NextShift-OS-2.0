import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoFinalizeService } from '@/modules/video/services/video-finalize-service';
import { assertTenantOperational } from '@/modules/tenant/services/tenant-operational-guard';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const Schema = z.object({
  create_performance_record: z.boolean().optional(),
  platform: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  await assertTenantOperational(user.tenantId, 'claim');
  const body = Schema.parse(await request.json().catch(() => ({})));
  await assertTenantOperational(user.tenantId, 'pre_side_effect');
  const result = await videoFinalizeService.markPublished(user, await getId(context), body);
  return NextResponse.json({ data: result });
});
