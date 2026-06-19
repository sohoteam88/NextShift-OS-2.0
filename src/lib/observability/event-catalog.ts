export const RUNTIME_EVENTS = {
  assignmentReceived: 'runtime.assignment_received',
  executionStarted: 'runtime.execution_started',
  executionCompleted: 'runtime.execution_completed',
  executionFailed: 'runtime.execution_failed',
} as const;

export const COO_EVENTS = {
  recommendationGenerated: 'coo.recommendation_generated',
} as const;

export const ANALYTICS_EVENTS = {
  projectionConsumed: 'analytics.projection_consumed',
} as const;

export const DASHBOARD_EVENTS = {
  projectionConsumed: 'dashboard.projection_consumed',
} as const;

export const ERROR_EVENTS = {
  externalServiceFailed: 'error.external_service_failed',
} as const;

export const OBSERVABILITY_MODULES = {
  agentRuntime: 'agent-runtime',
  aiWorkforce: 'ai-workforce',
  aiCoo: 'ai-coo',
  analytics: 'analytics',
  dashboard: 'dashboard',
} as const;

export type RuntimeEventName = (typeof RUNTIME_EVENTS)[keyof typeof RUNTIME_EVENTS];

export type COOEventName = (typeof COO_EVENTS)[keyof typeof COO_EVENTS];

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type DashboardEventName = (typeof DASHBOARD_EVENTS)[keyof typeof DASHBOARD_EVENTS];

export type ErrorEventName = (typeof ERROR_EVENTS)[keyof typeof ERROR_EVENTS];

export type ObservabilityEventName = RuntimeEventName | COOEventName | AnalyticsEventName | DashboardEventName | ErrorEventName;
