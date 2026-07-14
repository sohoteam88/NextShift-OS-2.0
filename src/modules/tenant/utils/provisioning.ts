import { z } from 'zod';

export const TenantProvisionIntentSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(3).max(30).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  plan: z.enum(['starter', 'growth', 'pro']).default('starter'),
  owner_name: z.string().trim().min(1).max(100),
});

export type TenantProvisionIntent = z.infer<typeof TenantProvisionIntentSchema>;

export type ProvisioningMetadata = TenantProvisionIntent & {
  locale?: 'zh' | 'en' | 'ms';
};

export function getTenantProvisionIntent(metadata: unknown): TenantProvisionIntent | null {
  const result = TenantProvisionIntentSchema.safeParse(metadata);
  return result.success ? result.data : null;
}

export function getProvisioningLocale(metadata: unknown): 'zh' | 'en' | 'ms' {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 'zh';

  const locale = (metadata as Record<string, unknown>).locale;
  return locale === 'en' || locale === 'ms' || locale === 'zh' ? locale : 'zh';
}
