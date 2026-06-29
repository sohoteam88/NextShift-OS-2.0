import type {
  BusinessId,
  DecisionId,
  RecommendationId,
  Result,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";
import type { BusinessTwinSnapshot } from "../business-twin";

export interface Recommendation {
  readonly recommendationId: RecommendationId;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly rationale: string;
  readonly expectedImpact?: string;
  readonly confidence: number;
  readonly createdAt: Timestamp;
}

export interface DecisionRecord {
  readonly decisionId: DecisionId;
  readonly businessId: BusinessId;
  readonly recommendationId?: RecommendationId;
  readonly decision: string;
  readonly rationale?: string;
  readonly decidedAt: Timestamp;
}

export interface GenerateRecommendationRequest {
  readonly tenant: TenantContext;
  readonly businessContext: BusinessTwinSnapshot;
  readonly objective?: string;
}

export interface DecisionBrainContract {
  generateRecommendations(
    request: GenerateRecommendationRequest
  ): Promise<Result<readonly Recommendation[]>>;
}
