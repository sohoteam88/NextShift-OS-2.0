// Unified Telemetry — Sentry (errors) + PostHog (analytics)
// Setup: pnpm add posthog-js
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

export async function trackUserSignedUp(
  userId: string,
  properties: { plan: string; source?: string; locale: string },
) {
  const eventProperties = { ...properties, timestamp: Date.now() };

  if (typeof window !== 'undefined') {
    await analytics.identify(userId, { plan: properties.plan, locale: properties.locale });
    await analytics.track('user_signed_up', eventProperties);
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  try {
    await fetch(new URL('/capture/', apiHost), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: 'user_signed_up',
        properties: {
          distinct_id: userId,
          ...eventProperties,
        },
      }),
    });
  } catch {
    // Telemetry must not block a successfully provisioned workspace.
  }
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

export function trackRecommendationViewed(userId: string, properties: { recommendationId: string; source: string; confidence: number }) {
  analytics.track('recommendation_viewed', { ...properties, userId });
}

export function trackRecommendationClicked(userId: string, properties: { recommendationId: string; ctaTarget: string }) {
  analytics.track('recommendation_clicked', { ...properties, userId });
}

export function trackDiscussionTurnSent(userId: string, properties: { recommendationId: string; turnNumber: number }) {
  analytics.track('discussion_turn_sent', { ...properties, userId });
}

export function trackWeeklyActive(userId: string, properties: Record<string, never>) {
  analytics.track('weekly_active', { ...properties, userId });
}

export async function fetchTelemetryUserId(): Promise<string | null> {
  try {
    const response = await fetch('/api/v1/auth/me');
    if (!response.ok) return null;

    const json = await response.json() as { data?: { user?: { id?: unknown } } };
    const userId = json.data?.user?.id;
    return typeof userId === 'string' && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}
