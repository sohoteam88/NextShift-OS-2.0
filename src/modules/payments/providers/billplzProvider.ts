import type { PaymentProviderInterface, CheckoutSession, PaymentStatus } from '../types';
import type { PlanId } from '@/modules/saas/types';
import type { BillingCycle } from '../types';
import { getPlanPrice } from '../billingPlanMapper';

const API_KEY = process.env.BILLPLZ_API_KEY ?? '';
const SANDBOX = process.env.BILLPLZ_SANDBOX === 'true';
const BASE_URL = SANDBOX ? 'https://www.billplz-sandbox.com' : 'https://www.billplz.com';

export const billplzProvider: PaymentProviderInterface = {
  name: 'billplz',

  async createCheckoutSession(userId: string, tenantId: string, planId: PlanId, cycle: BillingCycle): Promise<CheckoutSession> {
    if (!API_KEY) throw new Error('Billplz API key not configured');

    const price = getPlanPrice(planId, 'billplz', cycle);
    if (!price) throw new Error(`No price found for plan: ${planId}`);

    const amount = price.price * 100; // Billplz expects sen (RM1 = 100)
    const description = `NextShift OS — ${planId} ${cycle}`;
    const paymentId = `pay-${Date.now()}`;

    if (SANDBOX) {
      // Sandbox: return a mock checkout URL
      return {
        checkoutUrl: `${BASE_URL}/bills/test?amount=${amount}&description=${encodeURIComponent(description)}`,
        paymentId,
        provider: 'billplz',
      };
    }

    // Production Billplz API call
    try {
      const auth = Buffer.from(`${API_KEY}:`).toString('base64');
      const res = await fetch(`${BASE_URL}/api/v3/bills`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection_id: process.env.BILLPLZ_COLLECTION_ID,
          email: 'user@example.com',
          name: 'NextShift User',
          amount,
          callback_url: `${process.env.BILLPLZ_CALLBACK_URL ?? ''}/api/payments/billplz/webhook`,
          redirect_url: process.env.BILLPLZ_REDIRECT_URL ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
          description,
          reference_1: paymentId,
          reference_1_label: 'Payment ID',
        }),
      });

      if (!res.ok) throw new Error(`Billplz API error: ${res.status}`);
      const data = await res.json();
      return { checkoutUrl: data.url, paymentId, provider: 'billplz' };
    } catch {
      // Fallback to sandbox URL in dev
      return { checkoutUrl: `${BASE_URL}/bills/test?amount=${amount}`, paymentId, provider: 'billplz' };
    }
  },

  async verifyWebhook(payload: unknown, signature?: string): Promise<{ verified: boolean; paymentId?: string; status?: PaymentStatus }> {
    const data = payload as Record<string, unknown> | null;
    if (!data) return { verified: false };
    const paid = data.paid === true || data.paid === 'true';
    return {
      verified: true,
      paymentId: data.reference_1 as string,
      status: paid ? 'paid' : 'failed',
    };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    if (SANDBOX) return 'paid';
    try {
      const auth = Buffer.from(`${API_KEY}:`).toString('base64');
      const res = await fetch(`${BASE_URL}/api/v3/bills/${providerPaymentId}`, { headers: { 'Authorization': `Basic ${auth}` } });
      if (!res.ok) return 'failed';
      const data = await res.json();
      return data.paid ? 'paid' : 'pending';
    } catch { return 'pending'; }
  },
};
