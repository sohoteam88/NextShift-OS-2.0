import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

const TrackSchema = z.object({
  event: z.enum(['view', 'whatsapp_click', 'form_start']),
});

async function getSlug(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).slug;
}

export async function POST(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const slug = await getSlug(context);

  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }

  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { event } = parsed.data;

  if (event === 'view') {
    // Deduplicate: 1 view per IP per funnel per hour
    if (!checkRateLimit(`view:${ip}:${slug}`, 1, 60 * 60 * 1000)) {
      return NextResponse.json({ ok: true, deduped: true });
    }
    await prisma.funnel.updateMany({ where: { slug, status: 'published' }, data: { views: { increment: 1 } } });
  }

  return NextResponse.json({ ok: true });
}
