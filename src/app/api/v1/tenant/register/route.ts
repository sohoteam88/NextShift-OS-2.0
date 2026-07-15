import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { tenantProvisioningService, isVerifiedSupabaseUser } from '@/modules/tenant/services/tenant-provisioning-service';
import { TenantProvisionIntentSchema } from '@/modules/tenant/utils/provisioning';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isVerifiedSupabaseUser(user)) {
      return NextResponse.json(
        {
          error: {
            code: 'EMAIL_VERIFICATION_REQUIRED',
            message: 'Please verify your email address before finishing workspace setup.',
          },
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const input = TenantProvisionIntentSchema.parse(body);
    const result = await tenantProvisioningService.provision(user, input);

    return NextResponse.json({ data: result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues } },
        { status: 400 },
      );
    }
    if (error instanceof Error && (error.name === 'PrismaClientInitializationError' || error.message.includes('DATABASE_URL'))) {
      return NextResponse.json(
        {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Tenant registration is temporarily unavailable',
          },
        },
        { status: 503 },
      );
    }
    console.error('Tenant registration error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Tenant registration failed' } },
      { status: 500 },
    );
  }
}
