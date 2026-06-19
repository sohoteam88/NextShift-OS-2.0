import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, verifyBillplzSignature } from '@/app/api/payments/billplz/webhook/route';

const paymentMocks = vi.hoisted(() => ({
  handleWebhook: vi.fn(),
}));

vi.mock('@/modules/payments/paymentService', () => ({
  paymentService: paymentMocks,
}));

function sign(body: string) {
  return createHmac('sha256', 'test-signature-key').update(body, 'utf8').digest('hex');
}

describe('Billplz webhook security', () => {
  beforeEach(() => {
    vi.stubEnv('BILLPLZ_X_SIGNATURE_KEY', 'test-signature-key');
    paymentMocks.handleWebhook.mockReset();
    paymentMocks.handleWebhook.mockResolvedValue({ success: true });
  });

  it('accepts a valid HMAC signature', async () => {
    const body = JSON.stringify({ id: 'bill-1', paid: true });
    const response = await POST(new Request('http://127.0.0.1/api/payments/billplz/webhook', {
      method: 'POST',
      headers: { 'x-billplz-signature': sign(body) },
      body,
    }) as never);

    expect(response.status).toBe(200);
    expect(paymentMocks.handleWebhook).toHaveBeenCalledWith({ id: 'bill-1', paid: true });
  });

  it('rejects an invalid HMAC signature', async () => {
    const body = JSON.stringify({ id: 'bill-1', paid: true });
    const response = await POST(new Request('http://127.0.0.1/api/payments/billplz/webhook', {
      method: 'POST',
      headers: { 'x-billplz-signature': 'bad-signature' },
      body,
    }) as never);

    expect(response.status).toBe(401);
    expect(paymentMocks.handleWebhook).not.toHaveBeenCalled();
  });

  it('rejects a missing HMAC signature', async () => {
    const body = JSON.stringify({ id: 'bill-1', paid: true });
    const response = await POST(new Request('http://127.0.0.1/api/payments/billplz/webhook', {
      method: 'POST',
      body,
    }) as never);

    expect(response.status).toBe(401);
    expect(paymentMocks.handleWebhook).not.toHaveBeenCalled();
  });

  it('rejects stale timestamps when the provider sends a timestamp header', () => {
    const body = JSON.stringify({ id: 'bill-1' });
    const oldTimestamp = String(Math.floor((Date.now() - 10 * 60 * 1000) / 1000));

    expect(verifyBillplzSignature(body, sign(body), oldTimestamp)).toBe(false);
  });
});
