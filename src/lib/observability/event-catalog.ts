export const RUNTIME_EVENTS = {
  assignmentReceived: 'runtime.assignment_received',
  executionStarted: 'runtime.execution_started',
  executionCompleted: 'runtime.execution_completed',
  executionFailed: 'runtime.execution_failed',
} as const;

export const ERROR_EVENTS = {
  externalServiceFailed: 'error.external_service_failed',
} as const;

export const OBSERVABILITY_MODULES = {
  agentRuntime: 'agent-runtime',
  aiWorkforce: 'ai-workforce',
} as const;

export type RuntimeEventName = (typeof RUNTIME_EVENTS)[keyof typeof RUNTIME_EVENTS];

export type ErrorEventName = (typeof ERROR_EVENTS)[keyof typeof ERROR_EVENTS];

export type ObservabilityEventName = RuntimeEventName | ErrorEventName;
