import type {
  Revenue,
  RevenueForecast,
  RevenueRepository,
  RevenueTargetId,
  RevenueTargetRepository,
} from "@nextshift/domain";
import {
  RevenueForecastCalculator,
  RevenueProgressCalculator,
} from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationQuery } from "../queries";

export interface CalculateRevenueForecastQuery extends ApplicationQuery {
  readonly queryType: "CalculateRevenueForecast";
  readonly revenueTargetId: RevenueTargetId;
  readonly asOf: Timestamp;
}

export interface GetRevenueForecastQuery extends ApplicationQuery {
  readonly queryType: "GetRevenueForecast";
  readonly revenueTargetId: RevenueTargetId;
  readonly asOf: Timestamp;
}

export interface GenerateRevenueForecastSummaryQuery extends ApplicationQuery {
  readonly queryType: "GenerateRevenueForecastSummary";
  readonly revenueTargetId: RevenueTargetId;
  readonly asOf: Timestamp;
}

export interface ListRevenueForecastsByBusinessQuery
  extends ApplicationQuery {
  readonly queryType: "ListRevenueForecastsByBusiness";
  readonly asOf: Timestamp;
}

export interface RevenueForecastApplicationResult {
  readonly forecast: RevenueForecast;
}

export interface RevenueForecastListApplicationResult {
  readonly forecasts: readonly RevenueForecast[];
}

export interface RevenueForecastApplicationError {
  readonly code:
    | "RevenueTargetNotFound"
    | "ValidationFailed"
    | "RevenueForecastCalculationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class RevenueForecastApplicationService {
  constructor(
    private readonly targetRepository: RevenueTargetRepository,
    private readonly revenueRepository: RevenueRepository,
    private readonly progressCalculator: RevenueProgressCalculator =
      new RevenueProgressCalculator(),
    private readonly forecastCalculator: RevenueForecastCalculator =
      new RevenueForecastCalculator()
  ) {}

  async calculateRevenueForecast(
    query: CalculateRevenueForecastQuery
  ): Promise<
    Result<RevenueForecastApplicationResult, RevenueForecastApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async getRevenueForecast(
    query: GetRevenueForecastQuery
  ): Promise<
    Result<RevenueForecastApplicationResult, RevenueForecastApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async generateRevenueForecastSummary(
    query: GenerateRevenueForecastSummaryQuery
  ): Promise<
    Result<RevenueForecastApplicationResult, RevenueForecastApplicationError>
  > {
    return this.calculateForTarget(query.revenueTargetId, query);
  }

  async listRevenueForecastsByBusiness(
    query: ListRevenueForecastsByBusinessQuery
  ): Promise<
    Result<
      RevenueForecastListApplicationResult,
      RevenueForecastApplicationError
    >
  > {
    try {
      const targets = (
        await this.targetRepository.findByBusinessId(query.context.businessId)
      ).filter((target) => target.status === "active");
      const revenue = await this.revenueRepository.findByBusinessId(
        query.context.businessId
      );
      const revenueAsOf = filterRevenueAsOf(revenue, query.asOf);

      return success({
        forecasts: Object.freeze(
          targets.map((target) => {
            const progress = this.progressCalculator.calculate(
              target,
              revenueAsOf
            );

            return this.forecastCalculator.calculate(
              target,
              progress,
              revenueAsOf,
              query.asOf
            );
          })
        ),
      });
    } catch (error) {
      return failure(mapRevenueForecastApplicationError(error));
    }
  }

  private async calculateForTarget(
    revenueTargetId: RevenueTargetId,
    query:
      | CalculateRevenueForecastQuery
      | GetRevenueForecastQuery
      | GenerateRevenueForecastSummaryQuery
  ): Promise<
    Result<RevenueForecastApplicationResult, RevenueForecastApplicationError>
  > {
    try {
      const target = await this.targetRepository.findById(revenueTargetId);

      if (!target || target.businessId !== query.context.businessId) {
        return failure(revenueTargetNotFound(revenueTargetId));
      }

      const revenue = await this.revenueRepository.findByBusinessId(
        query.context.businessId
      );
      const revenueAsOf = filterRevenueAsOf(revenue, query.asOf);
      const progress = this.progressCalculator.calculate(target, revenueAsOf);

      return success({
        forecast: this.forecastCalculator.calculate(
          target,
          progress,
          revenueAsOf,
          query.asOf
        ),
      });
    } catch (error) {
      return failure(mapRevenueForecastApplicationError(error));
    }
  }
}

function filterRevenueAsOf(
  revenue: readonly Revenue[],
  asOf: Timestamp
): readonly Revenue[] {
  const asOfTime = Date.parse(asOf);

  return revenue.filter((item) => {
    const snapshot = item.toSnapshot();

    return (
      snapshot.status !== "recognized" ||
      (snapshot.recognizedAt !== undefined &&
        Date.parse(snapshot.recognizedAt) <= asOfTime)
    );
  });
}

function revenueTargetNotFound(
  revenueTargetId: RevenueTargetId
): RevenueForecastApplicationError {
  return {
    code: "RevenueTargetNotFound",
    message: `Revenue target ${revenueTargetId} was not found.`,
  };
}

function mapRevenueForecastApplicationError(
  error: unknown
): RevenueForecastApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Revenue forecast calculation failed validation.",
    cause: error,
  };
}
