import type { WebinarPackage } from './types';

export type WebinarGenerationOutcome =
  | {
      status: 'success';
      source: 'response' | 'reconciliation';
      previousId: string | null;
      data: WebinarPackage;
    }
  | {
      status: 'definite_failure';
      previousId: string | null;
      error: string;
    }
  | {
      status: 'ambiguous';
      previousId: string | null;
      error: string;
    };

function isWebinarPackage(value: unknown): value is WebinarPackage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WebinarPackage>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Boolean(candidate.topic && typeof candidate.topic.title === 'string') &&
    typeof candidate.loomScript === 'string' &&
    Boolean(
      candidate.registrationPage &&
      typeof candidate.registrationPage.headline === 'string',
    )
  );
}

export async function reconcileWebinarGeneration(
  previousId: string | null,
  request: typeof fetch = fetch,
): Promise<WebinarGenerationOutcome> {
  try {
    const response = await request('/api/v1/webinar-center', { method: 'GET' });
    if (!response.ok) {
      return {
        status: 'ambiguous',
        previousId,
        error: '生成结果尚不明确，状态检查失败。请重新检查状态。',
      };
    }
    const payload = (await response.json()) as { data?: unknown };
    if (payload.data !== null && !isWebinarPackage(payload.data)) {
      return {
        status: 'ambiguous',
        previousId,
        error: '生成结果尚不明确，服务器返回的状态无法验证。请重新检查状态。',
      };
    }
    if (isWebinarPackage(payload.data) && payload.data.id !== previousId) {
      return {
        status: 'success',
        source: 'reconciliation',
        previousId,
        data: payload.data,
      };
    }
    return {
      status: 'definite_failure',
      previousId,
      error: '已确认本次生成没有产生新版本，可以安全重试。',
    };
  } catch {
    return {
      status: 'ambiguous',
      previousId,
      error: '生成结果尚不明确，状态检查失败。请重新检查状态。',
    };
  }
}

export async function generateWebinarWithReconciliation(
  previousId: string | null,
  request: typeof fetch = fetch,
): Promise<WebinarGenerationOutcome> {
  let response: Response;
  try {
    response = await request('/api/v1/webinar-center/generate', {
      method: 'POST',
    });
  } catch {
    return reconcileWebinarGeneration(previousId, request);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    return {
      status: 'definite_failure',
      previousId,
      error: body.error?.message ?? '重新生成失败，现有 Webinar 已保留。',
    };
  }

  try {
    const body = (await response.json()) as { data?: unknown };
    if (isWebinarPackage(body.data) && body.data.id !== previousId) {
      return {
        status: 'success',
        source: 'response',
        previousId,
        data: body.data,
      };
    }
  } catch {
    // Reconcile a possibly committed request whose response was lost.
  }
  return reconcileWebinarGeneration(previousId, request);
}
