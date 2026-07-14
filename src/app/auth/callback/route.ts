import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  isVerifiedSupabaseUser,
  tenantProvisioningService,
} from '@/modules/tenant/services/tenant-provisioning-service';
import { getTenantProvisionIntent } from '@/modules/tenant/utils/provisioning';

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return redirectTo(request, '/login?error=email_confirmation_failed');

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !isVerifiedSupabaseUser(data.user)) {
    return redirectTo(request, '/login?error=email_confirmation_failed');
  }

  const intent = getTenantProvisionIntent(data.user.user_metadata);
  if (!intent) return redirectTo(request, '/setup-workspace');

  try {
    await tenantProvisioningService.provision(data.user, intent);
    return redirectTo(request, '/onboarding');
  } catch {
    return redirectTo(request, '/setup-workspace?error=provisioning_failed');
  }
}
