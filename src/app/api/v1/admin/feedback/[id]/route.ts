import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const UpdateSchema = z.object({ status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed']) });

export const PATCH = apiHandler(async (request: NextRequest, context?: { params: Promise<Record<string, string>> | Record<string, string> }) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin', 'operator']);
  const params = await Promise.resolve(context!.params);
  const id = 'id' in params ? (params as Record<string, string>).id : (params as any).id;
  const body = await request.json();
  const { status } = UpdateSchema.parse(body);

  const feedback = await prisma.feedback.update({ where: { id }, data: { status, updatedAt: new Date() } });
  return NextResponse.json({ data: feedback });
});
