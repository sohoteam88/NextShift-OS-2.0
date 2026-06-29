import type {
  RevenueProgress,
  RevenueRepository,
  RevenueTargetId,
  RevenueTargetRepository,
} from "@nextshift/domain";
import { RevenueProgressCalculator } from "@nextshift/domain";
import type { Result } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationQuery } from "../queries";

export interface CalculateRevenueProgressQuery extends ApplicationQuery {
  readonly queryType: "CalculateRevenueProgress";
  readonly revenueTargetId: RevenueTargetId;
}

export interface GetRevenueProgressQuery extends ApplicationQuery {
  readonly queryType: "GetRevenueProgress";
  readonly revenueTargetId: RevenueTargetId;
}

export interface CompareRevenueAgainstTargetQuery extends ApplicationQuery {
  readonly queryType: "CompareRevenueAgainstTarget";
  readonly revenueTargetId: RevenueTargetId;
}

export interface GenerateRevenueProgressSummaryQuery extends ApplicationQuery {
  readonly queryType: "GenerateRevenueProgressSummary";
  readonly revenueTargetId: RevenueTargetId;
}

export interface ListRevenueProgressByBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListRevenueProgressByBusiness";
}

export interface RevenueProgressApplicationResult {
  readonly progress: RevenueProgress;
}

export interface RevenueProgressListApplicationResult {
  readonly progress: readonly RevenueProgress[];
}

export interface RevenueProgressApplicationError {
  readonly code:
    | "RevenueTargetNotFound"
    | "ValidationFailed"
    | "RevenueProgressCalculationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class RevenueProgressApplicationService {
  constructor(
    private readonly targetRepository: RevenueTargetRepository,
    private readonly revenueRepository: RevenueRepository,
    private readonly calculator: RevenueProgressCalculator =
      new RevenueProgressCalculator()
  ) {}

  async calculateRevenueProgress(
    query: CalculateRevenueProgressQuery
  ): Promise<
    Result<RevenueProgressApplicationResult, RevenueProgressApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async getRevenueProgress(
    query: GetRevenueProgressQuery
  ): Promise<
    Result<RevenueProgressApplicationResult, RevenueProgressApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async compareRevenueAgainstTarget(
    query: CompareRevenueAgainstTargetQuery
  ): Promise<
    Result<RevenueProgressApplicationResult, RevenueProgressApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async generateRevenueProgressSummary(
    query: GenerateRevenueProgressSummaryQuery
  ): Promise<
    Result<RevenueProgressApplicationResult, RevenueProgressApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async listRevenueProgressByBusiness(
    query: ListRevenueProgressByBusinessQuery
  ): Promise<
    Result<
      RevenueProgressListApplicationResult,
      RevenueProgressApplicationError
    >
  > {
    try {
      const targets = (
        await this.targetRepository.findByBusinessId(query.context.businessId)
      ).filter((target) => target.status === "active");
      const revenue = await this.revenueRepository.findByBusinessId(
        query.context.businessId
      );

      return success({
        progress: Object.freeze(
          targets.map((target) => this.calculator.calculate(target, revenue))
        ),
      });
    } catch (error) {
      return failure(mapRevenueProgressApplicationError(error));
    }
  }

  private async calculateForTarget(
    revenueTargetId: RevenueTargetId,
    query: ApplicationQuery
  ): Promise<
    Result<RevenueProgressApplicationResult, RevenueProgressApplicationError>
  > {
    try {
      const target = await this.targetRepository.findById(revenueTargetId);

      if (!target || target.businessId !== query.context.businessId) {
        return failure(revenueTargetNotFound(revenueTargetId));
      }

      const revenue = await this.revenueRepository.findByBusinessId(
        query.context.businessId
      );

      return success({
        progress: this.calculator.calculate(target, revenue),
      });
    } catch (error) {
      return failure(mapRevenueProgressApplicationError(error));
    }
  }
}

function revenueTargetNotFound(
  revenueTargetId: RevenueTargetId
): RevenueProgressApplicationError {
  return {
    code: "RevenueTargetNotFound",
    message: `Revenue target ${revenueTargetId} was not found.`,
  };
}

function mapRevenueProgressApplicationError(
  error: unknown
): RevenueProgressApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Revenue progress calculation failed validation.",
    cause: error,
  };
}
