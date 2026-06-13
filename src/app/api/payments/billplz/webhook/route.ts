import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/modules/payments/paymentService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await paymentService.handleWebhook(body);
    if (result.success) {
      return NextResponse.json({ status: 'ok' });
    }
    return NextResponse.json({ status: 'error', message: 'Verification failed' }, { status: 400 });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
