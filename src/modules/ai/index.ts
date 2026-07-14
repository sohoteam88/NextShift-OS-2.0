// ─── AI Domain — Public Barrel Export (V5) ────────────────────────────────────
// Stable public API for the unified AI module.
// Deep imports (e.g. '@/modules/ai/services/content-service') continue to work.

// ── Request routing (single entry point for all AI calls) ────────────────────
export { routeAiRequest } from './services/ai-request-router';

// ── Router (model selection) ─────────────────────────────────────────────────
export { AIRouter, getRouter, getRouterForTenant } from './router';

// ── Model registry ───────────────────────────────────────────────────────────
export {
  getAvailableModels,
  getModelsByTier,
  getModelById,
  getProviderSummaries,
  getFirstAvailableProvider,
} from './router/model-registry';
export type { ModelConfig, ProviderSummary } from './router/model-registry';

// ── Task classification ──────────────────────────────────────────────────────
export { classifyTask } from './router/task-classifier';
export type { TaskCategory, TaskClassification, AITaskType } from './router/task-classifier';

// ── Provider factory ─────────────────────────────────────────────────────────
export { getProvider } from './providers/factory';
export type { AIProvider, AIGenerateParams, AIGenerateResult, AIProviderName } from './providers/types';

// ── Agent management ─────────────────────────────────────────────────────────
export { agentManager } from './services/agent-manager';
export { agentMemoryService } from './services/agent-memory';
export { orchestrateForGoal } from './services/workforce-orchestrator';

// ── Usage & quota ────────────────────────────────────────────────────────────
export {
  DEFAULT_DAILY_TENANT_CALL_LIMIT,
  checkDailyTenantQuota,
  checkQuota,
  enforceDailyTenantQuota,
  enforceQuota,
} from './usage/quota';
export { logAIUsage, getUsageStats } from './usage/tracker';

// ── Policies ─────────────────────────────────────────────────────────────────
export { decidePolicy, getTaskDefinition } from './services/model-policy-engine';
export { estimateCredits } from './services/cost-estimator';

// ── Key types ────────────────────────────────────────────────────────────────
export type {
  NormalizedResponse,
  RouterRequest,
  PlanTier,
  PolicyDecision,
  CostEstimate,
  ProviderInfo,
  TaskDefinition,
} from './types/requests';

export type {
  AgentId,
  AgentDefinition,
  AgentExecutionInput,
  AgentExecutionReport,
  MultiAgentReport,
  WorkforceState,
} from './types/agents';

// ── Feature services ─────────────────────────────────────────────────────────
export { contentService } from './services/content-service';
export { templateService } from './services/template-service';
export { whatsappReplyService } from './services/whatsapp-reply-service';
export { leadAnalysisService } from './services/lead-analysis-service';
export { funnelCopyService } from './services/funnel-copy-service';
export { contentPlanService } from './services/content-plan-service';
export { funnelBuilderService } from './services/funnel-builder-service';

// ── Prompt utilities ─────────────────────────────────────────────────────────
export { resolveVariables, buildPrompt } from './prompt/resolver';
export { validateAIOutput, sanitizePromptVariable } from './prompt/validator';
