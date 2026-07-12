import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/request-ip';
import { calculateLeadScore } from '@/modules/crm/services/scoring-service';
import { logActivity } from '@/modules/crm/services/activity-service';

const SubmitSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().max(20).optional(),
  quiz_result: z.object({ score: z.number(), title: z.string() }).optional(),
  source_funnel_id: z.string().uuid(),
  website: z.string().max(0).optional(), // honeypot
});

async function getSlug(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).slug;
}

export async function POST(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const ip = getRequestIp(request.headers);

  // Rate limit: 10 per IP per hour
  if (!(await checkRateLimit(`submit:${ip}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many submissions' } }, { status: 429 });
  }

  const slug = await getSlug(context);

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues } }, { status: 400 });
  }

  const input = parsed.data;

  // Honeypot check
  if (input.website) {
    return NextResponse.json({ data: { success: true } }); // silent reject
  }

  // Find funnel
  const funnel = await prisma.funnel.findUnique({ where: { slug }, include: { owner: true } });
  if (!funnel || funnel.status !== 'published') {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  const config = funnel.config as { sections?: { type: string; whatsapp_redirect?: string }[] };
  const formSection = config.sections?.find(s => s.type === 'form');

  // Create lead (critical — fail fast if this fails)
  let lead: Awaited<ReturnType<typeof prisma.lead.create>>;
  try {
    lead = await prisma.lead.create({
      data: {
        tenantId: funnel.tenantId,
        ownerId: funnel.ownerId,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email || null,
        source: `funnel:${funnel.title}`,
        pipelineStage: 'new',
        score: 0,
        metadata: {
          funnel_id: funnel.id,
          funnel_slug: slug,
          ...(input.quiz_result && { quiz_result: input.quiz_result }),
        } as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error('[funnel/submit] lead.create failed:', err);
    return NextResponse.json({ error: { code: 'DB_ERROR', message: '提交失败，请重试' } }, { status: 500 });
  }

  // Non-critical: score + activity + analytics — don't block response if these fail
  try {
    const { score, reasons } = calculateLeadScore(lead);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { score, scoreReasons: reasons as never, scoreUpdatedAt: new Date() },
    });
  } catch (err) {
    console.error('[funnel/submit] score update failed:', err);
  }

  try {
    await logActivity({
      tenantId: funnel.tenantId,
      leadId: lead.id,
      userId: funnel.ownerId,
      type: 'lead_created',
      description: `从漏斗 "${funnel.title}" 获取的潜在客户`,
    });
  } catch (err) {
    console.error('[funnel/submit] logActivity failed:', err);
  }

  // Increment conversions
  try {
    await prisma.funnel.update({ where: { id: funnel.id }, data: { conversions: { increment: 1 } } });
  } catch (err) {
    console.error('[funnel/submit] conversions increment failed:', err);
  }

  // WhatsApp redirect
  const whatsappPhone = formSection?.whatsapp_redirect ?? funnel.owner.phone;
  let whatsapp_redirect: string | undefined;
  if (whatsappPhone) {
    const clean = String(whatsappPhone).replace(/\D/g, '');
    const quizMsg = input.quiz_result ? `，测试结果是「${input.quiz_result.title}」` : '';
    const msg = `你好！我刚在你的「${funnel.title}」页面留下了我的信息${quizMsg}，想了解更多 😊`;
    whatsapp_redirect = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  }

  return NextResponse.json({ data: { success: true, ...(whatsapp_redirect && { whatsapp_redirect }) } }, { status: 201 });
}
