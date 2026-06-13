import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { paymentService } from '@/modules/payments/paymentService';

const CheckoutSchema = z.object({
  planId: z.enum(['starter', 'pro', 'agency']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const { planId, billingCycle } = CheckoutSchema.parse(await req.json());

  const session = await paymentService.createCheckout(user.id, user.tenantId, planId, billingCycle);
  return NextResponse.json({ data: session });
});
