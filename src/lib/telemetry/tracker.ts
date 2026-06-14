// Unified Telemetry — Sentry (errors) + PostHog (analytics)
// Setup: pnpm add posthog-js posthog-node
//        Add NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST to .env.local
//        Sentry auto-enabled when SENTRY_DSN is set in environment.

// ─── Tracking API (client-safe, graceful degradation) ────────────────────────

type TrackProperties = Record<string, string | number | boolean | null>;

// PostHog is optional — graceful fallback if not installed
async function getPostHog(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  try {
    return await import('posthog-js').then((m: any) => m.default);
  } catch {
    return null;
  }
}

export const analytics = {
  async init() {
    const ph = await getPostHog();
    if (!ph) return;
    ph.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      autocapture: false,
      capture_pageview: false,
    });
  },
  async identify(userId: string, properties?: TrackProperties) {
    const ph = await getPostHog();
    ph?.identify(userId, properties);
  },
  async track(event: string, properties?: TrackProperties) {
    const ph = await getPostHog();
    ph?.capture(event, properties);
  },
};

// ─── Key Events ──────────────────────────────────────────────────────────────

export function trackUserSignedUp(userId: string, properties: { plan: string; source?: string; locale: string }) {
  analytics.identify(userId, { plan: properties.plan, locale: properties.locale });
  analytics.track('user_signed_up', { ...properties, timestamp: Date.now() });
}

export function trackFunnelCreated(userId: string, properties: { funnel_type: string; template_used: boolean; title: string }) {
  analytics.track('funnel_created', { ...properties, userId });
}

export function trackAIContentGenerated(userId: string, properties: { feature: string; provider: string; model: string; tokens: number; cost: number }) {
  analytics.track('ai_content_generated', { ...properties, userId });
}

export function trackContentPublished(userId: string, properties: { platform: string; content_type: string; word_count: number }) {
  analytics.track('content_published', { ...properties, userId });
}

export function trackUpgradeClicked(userId: string, properties: { current_plan: string; target_plan: string; source_page: string }) {
  analytics.track('upgrade_clicked', { ...properties, userId });
}
