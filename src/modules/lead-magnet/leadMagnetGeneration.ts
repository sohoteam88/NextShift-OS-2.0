import type { LeadMagnetConfig, LeadMagnetTrack, LeadMagnetType } from './types';

export type LeadMagnetGenerationRequest = {
  track: LeadMagnetTrack;
  type: Extract<LeadMagnetType, 'guide' | 'checklist' | 'template'>;
};

export type LeadMagnetGenerationOutcome =
  | { track: LeadMagnetTrack; data: LeadMagnetConfig }
  | { track: LeadMagnetTrack; error: string };

export async function generateLeadMagnetTracks(
  requests: LeadMagnetGenerationRequest[],
  request: typeof fetch = fetch,
): Promise<LeadMagnetGenerationOutcome[]> {
  return Promise.all(
    requests.map(async ({ track, type }) => {
      const response = await request('/api/v1/lead-magnet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, track }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
          message?: string;
        };
        return {
          track,
          error:
            payload.error?.message ??
            payload.message ??
            '引流资源暂时无法生成。',
        };
      }
      const payload = (await response.json()) as { data: LeadMagnetConfig };
      return { track, data: payload.data };
    }),
  );
}
