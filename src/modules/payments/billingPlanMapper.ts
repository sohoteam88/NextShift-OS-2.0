import type { PlanPrice, BillingCycle } from './types';
import type { PlanId } from '@/modules/saas/types';

export const PLAN_PRICES: PlanPrice[] = [
  { planId: 'starter', provider: 'billplz', price: 99, currency: 'MYR', billingCycle: 'monthly' },
  { planId: 'starter', provider: 'billplz', price: 990, currency: 'MYR', billingCycle: 'yearly' },
  { planId: 'pro', provider: 'billplz', price: 299, currency: 'MYR', billingCycle: 'monthly' },
  { planId: 'pro', provider: 'billplz', price: 2990, currency: 'MYR', billingCycle: 'yearly' },
  { planId: 'agency', provider: 'billplz', price: 999, currency: 'MYR', billingCycle: 'monthly' },
  { planId: 'agency', provider: 'billplz', price: 9990, currency: 'MYR', billingCycle: 'yearly' },
  { planId: 'starter', provider: 'stripe', price: 25, currency: 'USD', billingCycle: 'monthly' },
  { planId: 'pro', provider: 'stripe', price: 75, currency: 'USD', billingCycle: 'monthly' },
  { planId: 'agency', provider: 'stripe', price: 249, currency: 'USD', billingCycle: 'monthly' },
];

export function getPlanPrice(planId: PlanId, provider: string, cycle: BillingCycle): PlanPrice | undefined {
  return PLAN_PRICES.find(p => p.planId === planId && p.provider === provider && p.billingCycle === cycle);
}

export function formatPrice(price: PlanPrice): string {
  if (price.currency === 'MYR') return `RM${price.price}`;
  return `$${price.price}`;
}
