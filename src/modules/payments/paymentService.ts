import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { PlanId } from '@/modules/saas/types';
import type { BillingCycle, CheckoutSession, PaymentRecord } from './types';
import { billplzProvider } from './providers/billplzProvider';
import { assertTenantOperational, tenantOperationalState } from '@/modules/tenant/services/tenant-operational-guard';

export const paymentService = {
  async createCheckout(userId: string, tenantId: string, planId: PlanId, cycle: BillingCycle): Promise<CheckoutSession> {
    await assertTenantOperational(tenantId, 'claim');
    await assertTenantOperational(tenantId, 'pre_side_effect');
    const session = await billplzProvider.createCheckoutSession(userId, tenantId, planId, cycle);
    await assertTenantOperational(tenantId, 'pre_side_effect');

    const payment: PaymentRecord = {
      id: session.paymentId, tenantId, userId, provider: 'billplz',
      planId, billingCycle: cycle, amount: 0, currency: 'MYR',
      status: 'pending', checkoutUrl: session.checkoutUrl,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    // Store in metadata
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const payments: PaymentRecord[] = Array.isArray(meta.payment_records) ? (meta.payment_records as PaymentRecord[]) : [];
    payments.push(payment);
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, payment_records: payments.slice(-20) as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });

    return session;
  },

  async handleWebhook(payload: unknown): Promise<{ success: boolean; tenantId?: string; planId?: PlanId; suppressed?: 'TENANT_DELETED_TERMINAL' }> {
    const verify = await billplzProvider.verifyWebhook(payload);
    if (!verify.verified || !verify.paymentId) return { success: false };

    // Find payment record by checking all users' metadata (hacky but works without a payments table)
    const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, tenantId: true, metadata: true } });
    let tenantId: string | undefined;
    let planId: PlanId | undefined;

    for (const u of users) {
      const meta = (u.metadata as Record<string, unknown>) ?? {};
      const payments: PaymentRecord[] = Array.isArray(meta.payment_records) ? (meta.payment_records as PaymentRecord[]) : [];
      const match = payments.find(p => p.id === verify.paymentId);
      if (match) {
        tenantId = match.tenantId;
        planId = match.planId;
        const operational = await tenantOperationalState(tenantId, 'webhook');
        if (!operational.operational) {
          return { success: true, tenantId, planId, suppressed: operational.reason };
        }
        await assertTenantOperational(tenantId, 'pre_side_effect');
        // Update payment status
        match.status = verify.status ?? 'paid';
        match.paidAt = new Date().toISOString();
        match.updatedAt = new Date().toISOString();
        await prisma.user.update({ where: { id: u.id }, data: { metadata: { ...meta, payment_records: payments as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
        break;
      }
    }

    // If payment succeeded, update tenant plan
    if (verify.status === 'paid' && tenantId && planId) {
      await assertTenantOperational(tenantId, 'pre_side_effect');
      await prisma.tenant.update({
        where: { id: tenantId },
        // A provider callback may update the subscribed plan, but it is never
        // an authority to reactivate a suspended/deleted tenant.
        data: { plan: planId },
      });
    }

    return { success: true, tenantId, planId };
  },

  async getPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    return Array.isArray(meta.payment_records) ? (meta.payment_records as PaymentRecord[]) : [];
  },
};
