import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { tenantService } from '@/modules/tenant/services/tenant-service';
import { generateSlug, isReservedSlug, suggestSlug } from '@/modules/tenant/utils/slug';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  tenant_name: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const input = RegisterSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: { id: user.id },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'USER_EXISTS', message: 'User already registered' } },
        { status: 409 },
      );
    }

    const baseSlug = generateSlug(input.tenant_name || `${input.name}的团队`) || user.id.slice(0, 8);
    let candidateSlug = baseSlug;
    let attempt = 2;

    while (isReservedSlug(candidateSlug) || (await prisma.tenant.findUnique({ where: { slug: candidateSlug } }))) {
      candidateSlug = suggestSlug(baseSlug, attempt);
      attempt += 1;
    }

    const result = await tenantService.create({
      name: input.tenant_name || `${input.name}的团队`,
      slug: candidateSlug,
      plan: 'starter',
      ownerId: user.id,
      ownerEmail: user.email!,
      ownerName: input.name,
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
            message: 'Registration is temporarily unavailable',
          },
        },
        { status: 503 },
      );
    }
    console.error('Register error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } },
      { status: 500 },
    );
  }
}
