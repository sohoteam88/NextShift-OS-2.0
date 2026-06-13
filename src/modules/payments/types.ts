import type { PlanId } from '@/modules/saas/types';

export type PaymentProvider = 'billplz' | 'stripe';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export type InvoiceStatus = 'issued' | 'paid' | 'void';

export interface PaymentRecord {
  id: string; tenantId: string; userId: string; provider: PaymentProvider;
  providerPaymentId?: string; planId: PlanId; billingCycle: BillingCycle;
  amount: number; currency: string; status: PaymentStatus;
  checkoutUrl?: string; paidAt?: string; failedAt?: string;
  metadata?: Record<string, unknown>; createdAt: string; updatedAt: string;
}

export interface InvoiceRecord {
  id: string; tenantId: string; userId: string; provider: PaymentProvider;
  providerInvoiceId?: string; amount: number; currency: string;
  status: InvoiceStatus; invoiceUrl?: string; issuedAt: string; paidAt?: string;
}

export interface CheckoutSession {
  checkoutUrl: string; paymentId: string; provider: PaymentProvider;
}

export interface PlanPrice {
  planId: PlanId; provider: PaymentProvider; price: number; currency: string;
  billingCycle: BillingCycle; providerProductId?: string; providerCollectionId?: string;
}

export interface PaymentProviderInterface {
  readonly name: PaymentProvider;
  createCheckoutSession(userId: string, tenantId: string, planId: PlanId, cycle: BillingCycle): Promise<CheckoutSession>;
  verifyWebhook(payload: unknown, signature?: string): Promise<{ verified: boolean; paymentId?: string; status?: PaymentStatus }>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus>;
  cancelSubscription?(subscriptionId: string): Promise<void>;
}
