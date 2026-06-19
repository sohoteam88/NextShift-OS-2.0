import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { paymentService } from '@/modules/payments/paymentService';

function normalizeSignature(signature: string): string {
  return signature.trim().replace(/^sha256=/i, '');
}

function safeCompareHex(expectedHex: string, actualHex: string): boolean {
  if (!/^[a-f0-9]+$/i.test(actualHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function isFreshTimestamp(timestamp: string | null): boolean {
  if (!timestamp) return true;
  const value = Number(timestamp);
  if (!Number.isFinite(value)) return false;
  const timestampMs = value > 10_000_000_000 ? value : value * 1000;
  const maxSkewMs = 5 * 60 * 1000;
  return Math.abs(Date.now() - timestampMs) <= maxSkewMs;
}

export function verifyBillplzSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null = null,
): boolean {
  const secret = process.env.BILLPLZ_X_SIGNATURE_KEY;
  if (!secret || !signature || !rawBody || !isFreshTimestamp(timestamp)) return false;

  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return safeCompareHex(computed, normalizeSignature(signature));
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-billplz-signature');
    const timestamp = req.headers.get('x-billplz-timestamp');
    const rawBody = await req.text();

    if (!verifyBillplzSignature(rawBody, signature, timestamp)) {
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const result = await paymentService.handleWebhook(body);
    if (result.success) {
      return NextResponse.json({ status: 'ok' });
    }
    return NextResponse.json({ status: 'error', message: 'Verification failed' }, { status: 400 });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
