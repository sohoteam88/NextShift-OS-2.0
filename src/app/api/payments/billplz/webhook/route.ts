import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/modules/payments/paymentService';

function verifyBillplzSignature(body: unknown, signature: string | null): boolean {
  // Verify webhook authenticity using X-Billplz-Signature header
  // Billplz signs payloads with HMAC-SHA256 using your X-Signature key
  if (!signature) return false;
  // TODO: Replace with actual HMAC verification using process.env.BILLPLZ_X_SIGNATURE_KEY
  // const crypto = await import('crypto');
  // const computed = crypto.createHmac('sha256', process.env.BILLPLZ_X_SIGNATURE_KEY!).update(JSON.stringify(body)).digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  return true; // Placeholder — implement before production launch
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-billplz-signature');
    const body = await req.json().catch(() => ({}));

    if (!verifyBillplzSignature(body, signature)) {
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
    }

    const result = await paymentService.handleWebhook(body);
    if (result.success) {
      return NextResponse.json({ status: 'ok' });
    }
    return NextResponse.json({ status: 'error', message: 'Verification failed' }, { status: 400 });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
