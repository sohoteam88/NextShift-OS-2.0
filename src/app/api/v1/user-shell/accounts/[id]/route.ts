import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import {
  setEnabled,
  setEnabledInputSchema,
  updateAccount,
  updateAccountPayloadSchema,
} from '@/modules/user-shell/services/userAccountService';

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

const accountIdSchema = z.object({ id: z.string().uuid() });

/** Updates editable account details or its active state for the authenticated owner. */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const { id } = accountIdSchema.parse(await Promise.resolve((context as RouteContext).params));
  const body: unknown = await request.json();

  if (typeof body === 'object' && body !== null && 'enabled' in body) {
    const payload = setEnabledInputSchema.pick({ enabled: true }).parse(body);
    const account = await setEnabled({ ...payload, id, tenantId: user.tenantId, userId: user.id });
    return NextResponse.json({ data: account });
  }

  const payload = updateAccountPayloadSchema.parse(body);
  const account = await updateAccount({ ...payload, id, tenantId: user.tenantId, userId: user.id });
  return NextResponse.json({ data: account });
});
