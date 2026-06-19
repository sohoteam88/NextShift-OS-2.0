export type RuntimeAuthorityScope = 'user' | 'tenant' | 'team' | 'platform';

export type RuntimeConfidence = 'confirmed' | 'derived' | 'inferred' | 'fallback';

export type RuntimeLifecycleStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export type RuntimeReviewStatus =
  | 'not_required'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export interface RuntimeLifecycle {
  source: string;
  scope: RuntimeAuthorityScope;
  confidence: RuntimeConfidence;
  fallback: string | 'none';

  executionId: string;
  status: RuntimeLifecycleStatus;
  reviewStatus: RuntimeReviewStatus;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  retryCount: number;
  lastTransitionAt: string;
}
