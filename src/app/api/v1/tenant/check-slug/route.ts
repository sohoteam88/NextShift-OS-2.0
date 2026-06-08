import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeSlug, RESERVED_SLUGS, suggestSlug } from '@/modules/tenant/utils/slug';

async function getSuggestion(slug: string) {
  let candidate = suggestSlug(slug);
  let attempt = 2;

  while (
    RESERVED_SLUGS.includes(candidate as (typeof RESERVED_SLUGS)[number]) ||
    (await prisma.tenant.findUnique({ where: { slug: candidate } }))
  ) {
    attempt += 1;
    candidate = suggestSlug(slug, attempt);
  }

  return candidate;
}

export async function GET(request: NextRequest) {
  try {
    const inputSlug = request.nextUrl.searchParams.get('slug') ?? '';
    const slug = normalizeSlug(inputSlug);

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Slug must be at least 3 characters' } },
        { status: 400 },
      );
    }

    const reserved = RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]);
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    const available = !reserved && !existingTenant;

    return NextResponse.json({
      data: {
        available,
        ...(available ? {} : { suggestion: await getSuggestion(slug) }),
      },
    });
  } catch (error) {
    console.error('Slug availability check failed:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Slug availability is temporarily unavailable',
        },
      },
      { status: 503 },
    );
  }
}
