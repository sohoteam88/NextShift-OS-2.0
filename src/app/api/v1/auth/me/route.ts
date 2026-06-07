import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async () => {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    );
  }
  if (user.status === 'pending') {
    return NextResponse.json(
      { error: { code: 'MEMBER_PENDING', message: 'Your account is pending approval' } },
      { status: 403 },
    );
  }
  if (user.status === 'suspended') {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Your account has been suspended' } },
      { status: 401 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { id: true, name: true, slug: true, plan: true, settings: true, maxAiCalls: true },
  });

  return NextResponse.json({
    data: {
      user,
      tenant,
    },
  });
});
