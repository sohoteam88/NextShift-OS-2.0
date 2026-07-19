import type {
  LeadMagnetConfig,
  LeadMagnetTrack,
  LeadMagnetType,
} from './types';

export type LeadMagnetGenerationRequest = {
  track: LeadMagnetTrack;
  type: Extract<LeadMagnetType, 'guide' | 'checklist' | 'template'>;
  previousId?: string | null;
};

export type LeadMagnetGenerationOutcome =
  | {
      status: 'success';
      source: 'response' | 'reconciliation';
      track: LeadMagnetTrack;
      previousId: string | null;
      data: LeadMagnetConfig;
    }
  | {
      status: 'definite_failure';
      track: LeadMagnetTrack;
      previousId: string | null;
      error: string;
    }
  | {
      status: 'ambiguous';
      track: LeadMagnetTrack;
      previousId: string | null;
      error: string;
    };

type LeadMagnetCanonicalResponse = {
  data?: unknown;
  trackLeadMagnets?: Partial<Record<LeadMagnetTrack, unknown>>;
};

function isLeadMagnetConfig(value: unknown): value is LeadMagnetConfig {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LeadMagnetConfig>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.title === 'string' &&
    typeof candidate.promise === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}

function canonicalTrack(
  payload: LeadMagnetCanonicalResponse,
  track: LeadMagnetTrack,
): LeadMagnetConfig | null | undefined {
  const candidate =
    payload.trackLeadMagnets?.[track] ??
    (track === 'retail' ? payload.data : undefined);
  if (candidate === null || candidate === undefined) return candidate;
  if (!isLeadMagnetConfig(candidate)) return undefined;
  if (candidate.track && candidate.track !== track) return undefined;
  return candidate;
}

export async function reconcileLeadMagnetTrack(
  track: LeadMagnetTrack,
  previousId: string | null,
  request: typeof fetch = fetch,
): Promise<LeadMagnetGenerationOutcome> {
  try {
    const response = await request('/api/v1/lead-magnet', { method: 'GET' });
    if (!response.ok) {
      return {
        status: 'ambiguous',
        track,
        previousId,
        error: '生成结果尚不明确，状态检查失败。请重新检查状态。',
      };
    }
    const payload = (await response.json()) as LeadMagnetCanonicalResponse;
    const current = canonicalTrack(payload, track);
    if (current === undefined) {
      return {
        status: 'ambiguous',
        track,
        previousId,
        error: '生成结果尚不明确，服务器返回的状态无法验证。请重新检查状态。',
      };
    }
    if (current && current.id !== previousId) {
      return {
        status: 'success',
        source: 'reconciliation',
        track,
        previousId,
        data: current,
      };
    }
    return {
      status: 'definite_failure',
      track,
      previousId,
      error: '已确认本次生成没有产生新版本，可以安全重试。',
    };
  } catch {
    return {
      status: 'ambiguous',
      track,
      previousId,
      error: '生成结果尚不明确，状态检查失败。请重新检查状态。',
    };
  }
}

export async function generateLeadMagnetTracks(
  requests: LeadMagnetGenerationRequest[],
  request: typeof fetch = fetch,
): Promise<LeadMagnetGenerationOutcome[]> {
  return Promise.all(
    requests.map(async ({ track, type, previousId = null }) => {
      let response: Response;
      try {
        response = await request('/api/v1/lead-magnet/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, track }),
        });
      } catch {
        return reconcileLeadMagnetTrack(track, previousId, request);
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
          message?: string;
        };
        return {
          status: 'definite_failure' as const,
          track,
          previousId,
          error:
            payload.error?.message ??
            payload.message ??
            '引流资源暂时无法生成。',
        };
      }
      try {
        const payload = (await response.json()) as { data?: unknown };
        if (
          isLeadMagnetConfig(payload.data) &&
          payload.data.track === track &&
          payload.data.id !== previousId
        ) {
          return {
            status: 'success' as const,
            source: 'response' as const,
            track,
            previousId,
            data: payload.data,
          };
        }
      } catch {
        // A committed request can lose or corrupt only its response body.
      }
      return reconcileLeadMagnetTrack(track, previousId, request);
    }),
  );
}
