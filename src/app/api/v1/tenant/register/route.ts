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
  email: z.string().email().optional(),
  registration_intent: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = TenantRegisterSchema.parse(body);
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fallbackUser = user
      ? null
      : await findRecentSignupUser(input.email, input.registration_intent);
    const authUser = user ?? fallbackUser;

    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

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
      where: { id: authUser.id },
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
      ownerId: authUser.id,
      ownerEmail: authUser.email!,
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

async function findRecentSignupUser(email?: string, registrationIntent?: string) {
  if (!email || !registrationIntent) return null;

  const rows = await prisma.$queryRaw<Array<{ id: string; email: string | null }>>`
    select id::text, email::text
    from auth.users
    where lower(email) = lower(${email})
      and raw_user_meta_data ->> 'registration_intent' = ${registrationIntent}
      and created_at > now() - interval '30 minutes'
    order by created_at desc
    limit 1
  `;

  const row = rows[0];
  if (!row?.id || !row.email) return null;
  return { id: row.id, email: row.email };
}
