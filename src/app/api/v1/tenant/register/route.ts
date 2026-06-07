import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { tenantService } from '@/modules/tenant/services/tenant-service';
import { isReservedSlug, normalizeSlug, suggestSlug } from '@/modules/tenant/utils/slug';
import { z } from 'zod';

const TenantRegisterSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  plan: z.enum(['starter', 'growth', 'pro']).default('starter'),
  owner_name: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const input = TenantRegisterSchema.parse(body);
    const slug = normalizeSlug(input.slug);

    if (!slug) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Slug is required' } },
        { status: 400 },
      );
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        {
          error: {
            code: 'SLUG_RESERVED',
            message: 'That team URL is reserved',
            suggestion: suggestSlug(slug),
          },
        },
        { status: 409 },
      );
    }

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return NextResponse.json(
        {
          error: {
            code: 'SLUG_TAKEN',
            message: 'That team URL is already taken',
            suggestion: suggestSlug(slug),
          },
        },
        { status: 409 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: user.id },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'USER_EXISTS', message: 'User already registered' } },
        { status: 409 },
      );
    }

    const result = await tenantService.create({
      name: input.name,
      slug,
      plan: input.plan,
      ownerId: user.id,
      ownerEmail: user.email!,
      ownerName: input.owner_name,
    });

    return NextResponse.json({ data: result }, { status: 201 });
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
