import type {
  BusinessBrainId,
  BusinessBrainRepository,
  BusinessHealth,
  BusinessHealthEvaluator,
  BusinessInsightGenerator,
  InsightGenerationResult,
  KnowledgeGraphBuilder,
  KnowledgeGraphSnapshot,
  OpportunityDetectionResult,
  OpportunityDetector,
} from "@nextshift/domain";
import {
  DefaultBusinessHealthEvaluator,
  DefaultBusinessInsightGenerator,
  DefaultKnowledgeGraphBuilder,
  DefaultOpportunityDetector,
} from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;

const defaultNow: Now = () => new Date().toISOString();

export interface AnalyzeBusinessBrainQuery extends ApplicationQuery {
  readonly queryType: "AnalyzeBusinessBrain";
  readonly businessBrainId: BusinessBrainId;
}

export interface BusinessBrainAnalysisResult {
  readonly businessHealth: BusinessHealth;
  readonly opportunityDetectionResult: OpportunityDetectionResult;
  readonly insightGenerationResult: InsightGenerationResult;
  readonly knowledgeGraphSnapshot: KnowledgeGraphSnapshot;
  readonly analyzedAt: Timestamp;
}

export interface BusinessBrainApplicationError {
  readonly code:
    | "BusinessBrainNotFound"
    | "BusinessBrainAnalysisFailed"
    | "ValidationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class BusinessBrainApplicationService {
  constructor(
    private readonly businessBrainRepository: BusinessBrainRepository,
    private readonly businessHealthEvaluator: BusinessHealthEvaluator =
      new DefaultBusinessHealthEvaluator(),
    private readonly opportunityDetector: OpportunityDetector =
      new DefaultOpportunityDetector(),
    private readonly businessInsightGenerator: BusinessInsightGenerator =
      new DefaultBusinessInsightGenerator(),
    private readonly knowledgeGraphBuilder: KnowledgeGraphBuilder =
      new DefaultKnowledgeGraphBuilder(),
    private readonly now: Now = defaultNow
  ) {}

  async analyzeBusinessBrain(
    query: AnalyzeBusinessBrainQuery
  ): Promise<Result<BusinessBrainAnalysisResult, BusinessBrainApplicationError>> {
    try {
      assertBusinessBrainId(query.businessBrainId);

      const businessBrain = await this.businessBrainRepository.findById(
        query.businessBrainId
      );

      if (!businessBrain) {
        return failure(businessBrainNotFound(query.businessBrainId));
      }

      const snapshot = businessBrain.toSnapshot();
      const businessHealth = this.businessHealthEvaluator.evaluate(snapshot);
      const opportunityDetectionResult =
        this.opportunityDetector.detect(snapshot);
      const insightGenerationResult =
        this.businessInsightGenerator.generate(snapshot);
      const knowledgeGraphSnapshot = this.knowledgeGraphBuilder.build(snapshot);

      return success({
        businessHealth,
        opportunityDetectionResult,
        insightGenerationResult,
        knowledgeGraphSnapshot,
        analyzedAt: this.now(),
      });
    } catch (error) {
      return failure(mapBusinessBrainApplicationError(error));
    }
  }
}

function assertBusinessBrainId(businessBrainId: BusinessBrainId): void {
  if (businessBrainId.trim().length === 0) {
    throw new Error("BusinessBrain ID is required.");
  }
}

function businessBrainNotFound(
  businessBrainId: BusinessBrainId
): BusinessBrainApplicationError {
  return {
    code: "BusinessBrainNotFound",
    message: `BusinessBrain ${businessBrainId} was not found.`,
  };
}

function mapBusinessBrainApplicationError(
  error: unknown
): BusinessBrainApplicationError {
  if (error instanceof Error) {
    return {
      code: "BusinessBrainAnalysisFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "BusinessBrainAnalysisFailed",
    message: "BusinessBrain analysis failed.",
    cause: error,
  };
}
