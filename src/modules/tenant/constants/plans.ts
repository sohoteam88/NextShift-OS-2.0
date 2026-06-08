export const PLAN_TIERS = {
  starter: {
    name: 'Starter',
    label_zh: '入门版',
    label_en: 'Starter',
    label_ms: 'Permulaan',
    max_members: 20,
    max_ai_calls: 200,
    max_funnels: 5,
    max_storage_mb: 1024,
    max_whatsapp_sequences: 3,
    custom_branding: false,
    price_myr: 0,
  },
  growth: {
    name: 'Growth',
    label_zh: '成长版',
    label_en: 'Growth',
    label_ms: 'Pertumbuhan',
    max_members: 100,
    max_ai_calls: 1000,
    max_funnels: 20,
    max_storage_mb: 5120,
    max_whatsapp_sequences: 10,
    custom_branding: true,
    price_myr: 99,
  },
  pro: {
    name: 'Pro',
    label_zh: '专业版',
    label_en: 'Pro',
    label_ms: 'Profesional',
    max_members: 500,
    max_ai_calls: 5000,
    max_funnels: 999,
    max_storage_mb: 20480,
    max_whatsapp_sequences: 999,
    custom_branding: true,
    price_myr: 299,
  },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS;

