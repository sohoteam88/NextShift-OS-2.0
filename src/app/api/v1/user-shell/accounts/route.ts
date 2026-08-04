import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { createAccount, createAccountInputSchema, listAccounts } from '@/modules/user-shell/services/userAccountService';

/** Returns and creates only accounts owned by the authenticated member. */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const accounts = await listAccounts({ tenantId: user.tenantId, userId: user.id });

  return NextResponse.json({ data: accounts });
});

/** Creates one real account record after the member has completed account setup. */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body: unknown = await request.json();
  const payload = createAccountInputSchema.pick({ platform: true, track: true, name: true, url: true }).parse(body);
  const account = await createAccount({ ...payload, tenantId: user.tenantId, userId: user.id });

  return NextResponse.json({ data: account }, { status: 201 });
});
