import type {
  AnalyticsProjection,
  AnalyticsProjectionId,
  AnalyticsProjectionType,
  AnalyticsRepository,
  BusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotId,
  BusinessPerformanceSnapshotReportingPeriod,
  CreateKPIInput,
  ExecutiveDashboard,
  ExecutiveDashboardId,
  KPI,
  PerformanceHealthScore,
  PerformanceHealthScoreId,
  TrendAnalysis,
  TrendAnalysisId,
} from "@nextshift/domain";
import {
  BusinessPerformanceSnapshotCalculator,
  ExecutiveDashboardCalculator,
  getAnalyticsProjectionBusinessId,
  InMemoryAnalyticsRepository,
  KPICalculator,
  PerformanceHealthScoreCalculator,
  TrendAnalysisCalculator,
  type KPIId,
} from "@nextshift/domain";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type {
  AnalyticsIntegrationEventPublisher,
  AnalyticsIntegrationEventSource,
} from "../integration-events/analytics";
import type { ApplicationQuery } from "../queries";

export interface CreateKPICommand extends ApplicationCommand {
  readonly commandType: "CreateKPI";
  readonly kpiId: KPIId;
  readonly name: string;
  readonly category: string;
  readonly targetValue: number;
  readonly actualValue?: number;
  readonly unit: string;
  readonly measurementDate: Timestamp;
}

export interface EvaluateKPIQuery extends ApplicationQuery {
  readonly queryType: "EvaluateKPI";
  readonly kpi: CreateKPIInput;
}

export interface GetKPISummaryQuery extends ApplicationQuery {
  readonly queryType: "GetKPISummary";
  readonly kpi: CreateKPIInput;
}

export interface CreateBusinessPerformanceSnapshotCommand
  extends ApplicationCommand {
  readonly commandType: "CreateBusinessPerformanceSnapshot";
  readonly snapshotId: BusinessPerformanceSnapshotId;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly kpis: readonly KPI[];
}

export interface EvaluateBusinessPerformanceSnapshotQuery
  extends ApplicationQuery {
  readonly queryType: "EvaluateBusinessPerformanceSnapshot";
  readonly snapshotId: BusinessPerformanceSnapshotId;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly kpis: readonly KPI[];
}

export interface CreateTrendAnalysisCommand extends ApplicationCommand {
  readonly commandType: "CreateTrendAnalysis";
  readonly trendId: TrendAnalysisId;
  readonly baselineSnapshot: BusinessPerformanceSnapshot;
  readonly comparisonSnapshot: BusinessPerformanceSnapshot;
  readonly generatedAt: Timestamp;
}

export interface EvaluateTrendAnalysisQuery extends ApplicationQuery {
  readonly queryType: "EvaluateTrendAnalysis";
  readonly trendId: TrendAnalysisId;
  readonly baselineSnapshot: BusinessPerformanceSnapshot;
  readonly comparisonSnapshot: BusinessPerformanceSnapshot;
  readonly generatedAt: Timestamp;
}

export interface CreateExecutiveDashboardCommand extends ApplicationCommand {
  readonly commandType: "CreateExecutiveDashboard";
  readonly dashboardId: ExecutiveDashboardId;
  readonly generatedAt: Timestamp;
  readonly performanceSnapshot: BusinessPerformanceSnapshot;
  readonly trendAnalysis: TrendAnalysis;
}

export interface EvaluateExecutiveDashboardQuery extends ApplicationQuery {
  readonly queryType: "EvaluateExecutiveDashboard";
  readonly dashboardId: ExecutiveDashboardId;
  readonly generatedAt: Timestamp;
  readonly performanceSnapshot: BusinessPerformanceSnapshot;
  readonly trendAnalysis: TrendAnalysis;
}

export interface CreatePerformanceHealthScoreCommand
  extends ApplicationCommand {
  readonly commandType: "CreatePerformanceHealthScore";
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly generatedAt: Timestamp;
  readonly executiveDashboard: ExecutiveDashboard;
}

export interface EvaluatePerformanceHealthScoreQuery extends ApplicationQuery {
  readonly queryType: "EvaluatePerformanceHealthScore";
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly generatedAt: Timestamp;
  readonly executiveDashboard: ExecutiveDashboard;
}

export interface SaveAnalyticsProjectionCommand extends ApplicationCommand {
  readonly commandType: "SaveAnalyticsProjection";
  readonly projection: AnalyticsProjection;
}

export interface GetAnalyticsProjectionQuery extends ApplicationQuery {
  readonly queryType: "GetAnalyticsProjection";
  readonly projectionType: AnalyticsProjectionType;
  readonly projectionId: AnalyticsProjectionId;
}

export interface ListAnalyticsProjectionsQuery extends ApplicationQuery {
  readonly queryType: "ListAnalyticsProjections";
  readonly projectionType: AnalyticsProjectionType;
}

export interface GetLatestAnalyticsProjectionQuery extends ApplicationQuery {
  readonly queryType: "GetLatestAnalyticsProjection";
  readonly projectionType: AnalyticsProjectionType;
}

export interface DeleteAnalyticsProjectionCommand extends ApplicationCommand {
  readonly commandType: "DeleteAnalyticsProjection";
  readonly projectionType: AnalyticsProjectionType;
  readonly projectionId: AnalyticsProjectionId;
}

export interface BuildAnalyticsInsightCommand extends ApplicationCommand {
  readonly commandType: "BuildAnalyticsInsight";
  readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
  readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
  readonly trendId: TrendAnalysisId;
  readonly dashboardId: ExecutiveDashboardId;
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly baselineReportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly comparisonReportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly baselineKPIs: readonly KPI[];
  readonly comparisonKPIs: readonly KPI[];
  readonly persist: boolean;
}

export interface EvaluateAnalyticsInsightQuery extends ApplicationQuery {
  readonly queryType: "EvaluateAnalyticsInsight";
  readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
  readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
  readonly trendId: TrendAnalysisId;
  readonly dashboardId: ExecutiveDashboardId;
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly baselineReportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly comparisonReportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly baselineKPIs: readonly KPI[];
  readonly comparisonKPIs: readonly KPI[];
}

export interface GetAnalyticsInsightQuery extends ApplicationQuery {
  readonly queryType: "GetAnalyticsInsight";
}

export interface ClearAnalyticsInsightProjectionIds {
  readonly businessPerformanceSnapshotId?: BusinessPerformanceSnapshotId;
  readonly trendAnalysisId?: TrendAnalysisId;
  readonly executiveDashboardId?: ExecutiveDashboardId;
  readonly performanceHealthScoreId?: PerformanceHealthScoreId;
}

export interface ClearAnalyticsInsightCommand extends ApplicationCommand {
  readonly commandType: "ClearAnalyticsInsight";
  readonly projectionIds: ClearAnalyticsInsightProjectionIds;
}

export interface KPIApplicationResult {
  readonly kpi: KPI;
}

export interface BusinessPerformanceSnapshotApplicationResult {
  readonly snapshot: BusinessPerformanceSnapshot;
}

export interface TrendAnalysisApplicationResult {
  readonly trend: TrendAnalysis;
}

export interface ExecutiveDashboardApplicationResult {
  readonly dashboard: ExecutiveDashboard;
}

export interface PerformanceHealthScoreApplicationResult {
  readonly healthScore: PerformanceHealthScore;
}

export interface AnalyticsProjectionApplicationResult {
  readonly projection?: AnalyticsProjection;
}

export interface AnalyticsProjectionListApplicationResult {
  readonly projections: readonly AnalyticsProjection[];
}

export interface DeleteAnalyticsProjectionApplicationResult {
  readonly deleted: boolean;
}

export interface AnalyticsInsightApplicationResult {
  readonly baselineSnapshot: BusinessPerformanceSnapshot;
  readonly comparisonSnapshot: BusinessPerformanceSnapshot;
  readonly trendAnalysis: TrendAnalysis;
  readonly executiveDashboard: ExecutiveDashboard;
  readonly performanceHealthScore: PerformanceHealthScore;
  readonly persisted: boolean;
}

export interface AnalyticsInsightRetrievalApplicationResult {
  readonly businessPerformanceSnapshot?: BusinessPerformanceSnapshot;
  readonly trendAnalysis?: TrendAnalysis;
  readonly executiveDashboard?: ExecutiveDashboard;
  readonly performanceHealthScore?: PerformanceHealthScore;
}

export interface AnalyticsInsightDeleteApplicationResult {
  readonly businessPerformanceSnapshotDeleted: boolean;
  readonly trendAnalysisDeleted: boolean;
  readonly executiveDashboardDeleted: boolean;
  readonly performanceHealthScoreDeleted: boolean;
}

export interface KPISummaryApplicationResult {
  readonly summary: {
    readonly kpiId: KPIId;
    readonly name: string;
    readonly targetValue: number;
    readonly actualValue?: number;
    readonly achievementPercentage?: number;
    readonly variance?: number;
    readonly status: string;
  };
}

export interface AnalyticsApplicationError {
  readonly code: "ValidationFailed" | "KPICalculationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class AnalyticsApplicationService {
  constructor(
    private readonly calculator: KPICalculator = new KPICalculator(),
    private readonly snapshotCalculator: BusinessPerformanceSnapshotCalculator =
      new BusinessPerformanceSnapshotCalculator(),
    private readonly trendCalculator: TrendAnalysisCalculator =
      new TrendAnalysisCalculator(),
    private readonly dashboardCalculator: ExecutiveDashboardCalculator =
      new ExecutiveDashboardCalculator(),
    private readonly healthScoreCalculator: PerformanceHealthScoreCalculator =
      new PerformanceHealthScoreCalculator(),
    private readonly analyticsRepository: AnalyticsRepository =
      new InMemoryAnalyticsRepository(),
    private readonly analyticsIntegrationEventPublisher?: AnalyticsIntegrationEventPublisher
  ) {}

  async createKPI(
    command: CreateKPICommand
  ): Promise<Result<KPIApplicationResult, AnalyticsApplicationError>> {
    const result = await this.calculate({
      kpiId: command.kpiId,
      businessId: command.context.businessId,
      name: command.name,
      category: command.category,
      targetValue: command.targetValue,
      actualValue: command.actualValue,
      unit: command.unit,
      measurementDate: command.measurementDate,
    });

    if (result.ok) {
      await this.publishAnalyticsEvent({
        eventType: "KPICreated",
        kpi: result.value.kpi,
        correlationId: command.context.correlationId,
      });
    }

    return result;
  }

  async evaluateKPI(
    query: EvaluateKPIQuery
  ): Promise<Result<KPIApplicationResult, AnalyticsApplicationError>> {
    return this.calculate({
      ...query.kpi,
      businessId: query.kpi.businessId ?? query.context.businessId,
    });
  }

  async getKPISummary(
    query: GetKPISummaryQuery
  ): Promise<Result<KPISummaryApplicationResult, AnalyticsApplicationError>> {
    const result = await this.calculate({
      ...query.kpi,
      businessId: query.kpi.businessId ?? query.context.businessId,
    });

    if (!result.ok) {
      return result;
    }

    const snapshot = result.value.kpi.toSnapshot();

    return success({
      summary: {
        kpiId: snapshot.kpiId,
        name: snapshot.name,
        targetValue: snapshot.targetValue,
        actualValue: snapshot.actualValue,
        achievementPercentage: snapshot.achievementPercentage,
        variance: snapshot.variance,
        status: snapshot.status,
      },
    });
  }

  async createBusinessPerformanceSnapshot(
    command: CreateBusinessPerformanceSnapshotCommand
  ): Promise<
    Result<
      BusinessPerformanceSnapshotApplicationResult,
      AnalyticsApplicationError
    >
  > {
    const result = await this.calculateSnapshot({
      snapshotId: command.snapshotId,
      businessId: command.context.businessId,
      reportingPeriod: command.reportingPeriod,
      generatedAt: command.generatedAt,
      kpis: command.kpis,
    });

    if (result.ok) {
      await this.publishAnalyticsEvent({
        eventType: "BusinessPerformanceSnapshotCreated",
        snapshot: result.value.snapshot,
        correlationId: command.context.correlationId,
      });
    }

    return result;
  }

  async evaluateBusinessPerformanceSnapshot(
    query: EvaluateBusinessPerformanceSnapshotQuery
  ): Promise<
    Result<
      BusinessPerformanceSnapshotApplicationResult,
      AnalyticsApplicationError
    >
  > {
    return this.calculateSnapshot({
      snapshotId: query.snapshotId,
      businessId: query.context.businessId,
      reportingPeriod: query.reportingPeriod,
      generatedAt: query.generatedAt,
      kpis: query.kpis,
    });
  }

  async createTrendAnalysis(
    command: CreateTrendAnalysisCommand
  ): Promise<Result<TrendAnalysisApplicationResult, AnalyticsApplicationError>> {
    const result = await this.calculateTrend({
      trendId: command.trendId,
      businessId: command.context.businessId,
      baselineSnapshot: command.baselineSnapshot,
      comparisonSnapshot: command.comparisonSnapshot,
      generatedAt: command.generatedAt,
    });

    if (result.ok) {
      await this.publishAnalyticsEvent({
        eventType: "TrendAnalysisCreated",
        trendAnalysis: result.value.trend,
        correlationId: command.context.correlationId,
      });
    }

    return result;
  }

  async evaluateTrendAnalysis(
    query: EvaluateTrendAnalysisQuery
  ): Promise<Result<TrendAnalysisApplicationResult, AnalyticsApplicationError>> {
    return this.calculateTrend({
      trendId: query.trendId,
      businessId: query.context.businessId,
      baselineSnapshot: query.baselineSnapshot,
      comparisonSnapshot: query.comparisonSnapshot,
      generatedAt: query.generatedAt,
    });
  }

  async createExecutiveDashboard(
    command: CreateExecutiveDashboardCommand
  ): Promise<
    Result<ExecutiveDashboardApplicationResult, AnalyticsApplicationError>
  > {
    const result = await this.calculateDashboard({
      dashboardId: command.dashboardId,
      businessId: command.context.businessId,
      generatedAt: command.generatedAt,
      performanceSnapshot: command.performanceSnapshot,
      trendAnalysis: command.trendAnalysis,
    });

    if (result.ok) {
      await this.publishAnalyticsEvent({
        eventType: "ExecutiveDashboardCreated",
        dashboard: result.value.dashboard,
        correlationId: command.context.correlationId,
      });
    }

    return result;
  }

  async evaluateExecutiveDashboard(
    query: EvaluateExecutiveDashboardQuery
  ): Promise<
    Result<ExecutiveDashboardApplicationResult, AnalyticsApplicationError>
  > {
    return this.calculateDashboard({
      dashboardId: query.dashboardId,
      businessId: query.context.businessId,
      generatedAt: query.generatedAt,
      performanceSnapshot: query.performanceSnapshot,
      trendAnalysis: query.trendAnalysis,
    });
  }

  async createPerformanceHealthScore(
    command: CreatePerformanceHealthScoreCommand
  ): Promise<
    Result<PerformanceHealthScoreApplicationResult, AnalyticsApplicationError>
  > {
    const result = await this.calculateHealthScore({
      healthScoreId: command.healthScoreId,
      businessId: command.context.businessId,
      generatedAt: command.generatedAt,
      executiveDashboard: command.executiveDashboard,
    });

    if (result.ok) {
      await this.publishAnalyticsEvent({
        eventType: "PerformanceHealthScoreCreated",
        healthScore: result.value.healthScore,
        correlationId: command.context.correlationId,
      });
    }

    return result;
  }

  async evaluatePerformanceHealthScore(
    query: EvaluatePerformanceHealthScoreQuery
  ): Promise<
    Result<PerformanceHealthScoreApplicationResult, AnalyticsApplicationError>
  > {
    return this.calculateHealthScore({
      healthScoreId: query.healthScoreId,
      businessId: query.context.businessId,
      generatedAt: query.generatedAt,
      executiveDashboard: query.executiveDashboard,
    });
  }

  async saveAnalyticsProjection(
    command: SaveAnalyticsProjectionCommand
  ): Promise<Result<AnalyticsProjectionApplicationResult, AnalyticsApplicationError>> {
    try {
      assertProjectionBusiness(
        command.projection,
        command.context.businessId,
        "Analytics projection must belong to the request business."
      );

      await this.analyticsRepository.saveProjection(command.projection);

      return success({ projection: command.projection });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  async getAnalyticsProjection(
    query: GetAnalyticsProjectionQuery
  ): Promise<Result<AnalyticsProjectionApplicationResult, AnalyticsApplicationError>> {
    try {
      const projection = await this.analyticsRepository.getProjectionById(
        query.projectionType,
        query.projectionId
      );

      if (projection) {
        assertProjectionBusiness(
          projection,
          query.context.businessId,
          "Analytics projection must belong to the request business."
        );
      }

      return success({ projection });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  async listAnalyticsProjections(
    query: ListAnalyticsProjectionsQuery
  ): Promise<
    Result<AnalyticsProjectionListApplicationResult, AnalyticsApplicationError>
  > {
    try {
      return success({
        projections: await this.analyticsRepository.listByBusiness(
          query.projectionType,
          query.context.businessId
        ),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  async getLatestAnalyticsProjection(
    query: GetLatestAnalyticsProjectionQuery
  ): Promise<Result<AnalyticsProjectionApplicationResult, AnalyticsApplicationError>> {
    try {
      return success({
        projection: await this.analyticsRepository.getLatestByBusiness(
          query.projectionType,
          query.context.businessId
        ),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  async deleteAnalyticsProjection(
    command: DeleteAnalyticsProjectionCommand
  ): Promise<
    Result<DeleteAnalyticsProjectionApplicationResult, AnalyticsApplicationError>
  > {
    try {
      const projection = await this.analyticsRepository.getProjectionById(
        command.projectionType,
        command.projectionId
      );

      if (projection) {
        assertProjectionBusiness(
          projection,
          command.context.businessId,
          "Analytics projection must belong to the request business."
        );
      }

      return success({
        deleted: await this.analyticsRepository.deleteProjection(
          command.projectionType,
          command.projectionId
        ),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  async buildAnalyticsInsight(
    command: BuildAnalyticsInsightCommand
  ): Promise<
    Result<AnalyticsInsightApplicationResult, AnalyticsApplicationError>
  > {
    const result = await this.calculateAnalyticsInsight({
      context: command.context,
      baselineSnapshotId: command.baselineSnapshotId,
      comparisonSnapshotId: command.comparisonSnapshotId,
      trendId: command.trendId,
      dashboardId: command.dashboardId,
      healthScoreId: command.healthScoreId,
      baselineReportingPeriod: command.baselineReportingPeriod,
      comparisonReportingPeriod: command.comparisonReportingPeriod,
      generatedAt: command.generatedAt,
      baselineKPIs: command.baselineKPIs,
      comparisonKPIs: command.comparisonKPIs,
      persisted: command.persist,
    });

    if (!result.ok || !command.persist) {
      return result;
    }

    for (const projection of [
      result.value.baselineSnapshot,
      result.value.comparisonSnapshot,
      result.value.trendAnalysis,
      result.value.executiveDashboard,
      result.value.performanceHealthScore,
    ]) {
      const saveResult = await this.saveAnalyticsProjection({
        commandType: "SaveAnalyticsProjection",
        context: command.context,
        projection,
      });

      if (!saveResult.ok) {
        return failure(saveResult.error);
      }
    }

    await this.publishAnalyticsEvent({
      eventType: "AnalyticsInsightBuilt",
      businessId: command.context.businessId,
      baselineSnapshotId: result.value.baselineSnapshot.snapshotId,
      comparisonSnapshotId: result.value.comparisonSnapshot.snapshotId,
      trendId: result.value.trendAnalysis.trendId,
      dashboardId: result.value.executiveDashboard.dashboardId,
      healthScoreId: result.value.performanceHealthScore.healthScoreId,
      generatedAt: command.generatedAt,
      persisted: true,
      correlationId: command.context.correlationId,
    });

    return result;
  }

  async evaluateAnalyticsInsight(
    query: EvaluateAnalyticsInsightQuery
  ): Promise<
    Result<AnalyticsInsightApplicationResult, AnalyticsApplicationError>
  > {
    return this.calculateAnalyticsInsight({
      context: query.context,
      baselineSnapshotId: query.baselineSnapshotId,
      comparisonSnapshotId: query.comparisonSnapshotId,
      trendId: query.trendId,
      dashboardId: query.dashboardId,
      healthScoreId: query.healthScoreId,
      baselineReportingPeriod: query.baselineReportingPeriod,
      comparisonReportingPeriod: query.comparisonReportingPeriod,
      generatedAt: query.generatedAt,
      baselineKPIs: query.baselineKPIs,
      comparisonKPIs: query.comparisonKPIs,
      persisted: false,
    });
  }

  async getAnalyticsInsight(
    query: GetAnalyticsInsightQuery
  ): Promise<
    Result<AnalyticsInsightRetrievalApplicationResult, AnalyticsApplicationError>
  > {
    try {
      const [
        businessPerformanceSnapshot,
        trendAnalysis,
        executiveDashboard,
        performanceHealthScore,
      ] = await Promise.all([
        this.analyticsRepository.getLatestByBusiness(
          "BusinessPerformanceSnapshot",
          query.context.businessId
        ),
        this.analyticsRepository.getLatestByBusiness(
          "TrendAnalysis",
          query.context.businessId
        ),
        this.analyticsRepository.getLatestByBusiness(
          "ExecutiveDashboard",
          query.context.businessId
        ),
        this.analyticsRepository.getLatestByBusiness(
          "PerformanceHealthScore",
          query.context.businessId
        ),
      ]);

      return success({
        businessPerformanceSnapshot:
          businessPerformanceSnapshot as BusinessPerformanceSnapshot | undefined,
        trendAnalysis: trendAnalysis as TrendAnalysis | undefined,
        executiveDashboard: executiveDashboard as ExecutiveDashboard | undefined,
        performanceHealthScore:
          performanceHealthScore as PerformanceHealthScore | undefined,
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  async clearAnalyticsInsight(
    command: ClearAnalyticsInsightCommand
  ): Promise<
    Result<AnalyticsInsightDeleteApplicationResult, AnalyticsApplicationError>
  > {
    const businessPerformanceSnapshotDeleted =
      await this.deleteOptionalAnalyticsProjection({
        context: command.context,
        projectionType: "BusinessPerformanceSnapshot",
        projectionId: command.projectionIds.businessPerformanceSnapshotId,
      });

    if (!businessPerformanceSnapshotDeleted.ok) {
      return businessPerformanceSnapshotDeleted;
    }

    const trendAnalysisDeleted = await this.deleteOptionalAnalyticsProjection({
      context: command.context,
      projectionType: "TrendAnalysis",
      projectionId: command.projectionIds.trendAnalysisId,
    });

    if (!trendAnalysisDeleted.ok) {
      return trendAnalysisDeleted;
    }

    const executiveDashboardDeleted = await this.deleteOptionalAnalyticsProjection({
      context: command.context,
      projectionType: "ExecutiveDashboard",
      projectionId: command.projectionIds.executiveDashboardId,
    });

    if (!executiveDashboardDeleted.ok) {
      return executiveDashboardDeleted;
    }

    const performanceHealthScoreDeleted =
      await this.deleteOptionalAnalyticsProjection({
        context: command.context,
        projectionType: "PerformanceHealthScore",
        projectionId: command.projectionIds.performanceHealthScoreId,
      });

    if (!performanceHealthScoreDeleted.ok) {
      return performanceHealthScoreDeleted;
    }

    return success({
      businessPerformanceSnapshotDeleted:
        businessPerformanceSnapshotDeleted.value,
      trendAnalysisDeleted: trendAnalysisDeleted.value,
      executiveDashboardDeleted: executiveDashboardDeleted.value,
      performanceHealthScoreDeleted: performanceHealthScoreDeleted.value,
    });
  }

  private async calculate(
    input: CreateKPIInput
  ): Promise<Result<KPIApplicationResult, AnalyticsApplicationError>> {
    try {
      return success({ kpi: this.calculator.calculate(input) });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  private async calculateSnapshot(input: {
    readonly snapshotId: BusinessPerformanceSnapshotId;
    readonly businessId: CreateKPIInput["businessId"];
    readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
    readonly generatedAt: Timestamp;
    readonly kpis: readonly KPI[];
  }): Promise<
    Result<
      BusinessPerformanceSnapshotApplicationResult,
      AnalyticsApplicationError
    >
  > {
    try {
      if (!input.businessId) {
        throw new Error("Business performance snapshot business ID is required.");
      }

      return success({
        snapshot: this.snapshotCalculator.calculate({
          snapshotId: input.snapshotId,
          businessId: input.businessId,
          reportingPeriod: input.reportingPeriod,
          generatedAt: input.generatedAt,
          kpis: input.kpis,
        }),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  private async calculateTrend(input: {
    readonly trendId: TrendAnalysisId;
    readonly businessId: CreateKPIInput["businessId"];
    readonly baselineSnapshot: BusinessPerformanceSnapshot;
    readonly comparisonSnapshot: BusinessPerformanceSnapshot;
    readonly generatedAt: Timestamp;
  }): Promise<Result<TrendAnalysisApplicationResult, AnalyticsApplicationError>> {
    try {
      if (!input.businessId) {
        throw new Error("Trend analysis business ID is required.");
      }

      if (
        input.baselineSnapshot.businessId !== input.businessId ||
        input.comparisonSnapshot.businessId !== input.businessId
      ) {
        throw new Error(
          "Trend analysis snapshots must belong to the request business."
        );
      }

      return success({
        trend: this.trendCalculator.calculate({
          trendId: input.trendId,
          baselineSnapshot: input.baselineSnapshot,
          comparisonSnapshot: input.comparisonSnapshot,
          generatedAt: input.generatedAt,
        }),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  private async calculateDashboard(input: {
    readonly dashboardId: ExecutiveDashboardId;
    readonly businessId: CreateKPIInput["businessId"];
    readonly generatedAt: Timestamp;
    readonly performanceSnapshot: BusinessPerformanceSnapshot;
    readonly trendAnalysis: TrendAnalysis;
  }): Promise<
    Result<ExecutiveDashboardApplicationResult, AnalyticsApplicationError>
  > {
    try {
      if (!input.businessId) {
        throw new Error("Executive dashboard business ID is required.");
      }

      if (
        input.performanceSnapshot.businessId !== input.businessId ||
        input.trendAnalysis.businessId !== input.businessId
      ) {
        throw new Error(
          "Executive dashboard analytical inputs must belong to the request business."
        );
      }

      return success({
        dashboard: this.dashboardCalculator.calculate({
          dashboardId: input.dashboardId,
          generatedAt: input.generatedAt,
          performanceSnapshot: input.performanceSnapshot,
          trendAnalysis: input.trendAnalysis,
        }),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  private async calculateHealthScore(input: {
    readonly healthScoreId: PerformanceHealthScoreId;
    readonly businessId: CreateKPIInput["businessId"];
    readonly generatedAt: Timestamp;
    readonly executiveDashboard: ExecutiveDashboard;
  }): Promise<
    Result<PerformanceHealthScoreApplicationResult, AnalyticsApplicationError>
  > {
    try {
      if (!input.businessId) {
        throw new Error("Performance health score business ID is required.");
      }

      if (input.executiveDashboard.businessId !== input.businessId) {
        throw new Error(
          "Performance health score dashboard must belong to the request business."
        );
      }

      return success({
        healthScore: this.healthScoreCalculator.calculate({
          healthScoreId: input.healthScoreId,
          generatedAt: input.generatedAt,
          executiveDashboard: input.executiveDashboard,
        }),
      });
    } catch (error) {
      return failure(mapAnalyticsApplicationError(error));
    }
  }

  private async calculateAnalyticsInsight(input: {
    readonly context: ApplicationCommand["context"];
    readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
    readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
    readonly trendId: TrendAnalysisId;
    readonly dashboardId: ExecutiveDashboardId;
    readonly healthScoreId: PerformanceHealthScoreId;
    readonly baselineReportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
    readonly comparisonReportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
    readonly generatedAt: Timestamp;
    readonly baselineKPIs: readonly KPI[];
    readonly comparisonKPIs: readonly KPI[];
    readonly persisted: boolean;
  }): Promise<
    Result<AnalyticsInsightApplicationResult, AnalyticsApplicationError>
  > {
    const baselineSnapshotResult = await this.calculateSnapshot({
      snapshotId: input.baselineSnapshotId,
      businessId: input.context.businessId,
      reportingPeriod: input.baselineReportingPeriod,
      generatedAt: input.generatedAt,
      kpis: input.baselineKPIs,
    });

    if (!baselineSnapshotResult.ok) {
      return failure(baselineSnapshotResult.error);
    }

    const comparisonSnapshotResult = await this.calculateSnapshot({
      snapshotId: input.comparisonSnapshotId,
      businessId: input.context.businessId,
      reportingPeriod: input.comparisonReportingPeriod,
      generatedAt: input.generatedAt,
      kpis: input.comparisonKPIs,
    });

    if (!comparisonSnapshotResult.ok) {
      return failure(comparisonSnapshotResult.error);
    }

    const trendResult = await this.calculateTrend({
      trendId: input.trendId,
      businessId: input.context.businessId,
      baselineSnapshot: baselineSnapshotResult.value.snapshot,
      comparisonSnapshot: comparisonSnapshotResult.value.snapshot,
      generatedAt: input.generatedAt,
    });

    if (!trendResult.ok) {
      return failure(trendResult.error);
    }

    const dashboardResult = await this.calculateDashboard({
      dashboardId: input.dashboardId,
      businessId: input.context.businessId,
      generatedAt: input.generatedAt,
      performanceSnapshot: comparisonSnapshotResult.value.snapshot,
      trendAnalysis: trendResult.value.trend,
    });

    if (!dashboardResult.ok) {
      return failure(dashboardResult.error);
    }

    const healthScoreResult = await this.calculateHealthScore({
      healthScoreId: input.healthScoreId,
      businessId: input.context.businessId,
      generatedAt: input.generatedAt,
      executiveDashboard: dashboardResult.value.dashboard,
    });

    if (!healthScoreResult.ok) {
      return failure(healthScoreResult.error);
    }

    return success({
      baselineSnapshot: baselineSnapshotResult.value.snapshot,
      comparisonSnapshot: comparisonSnapshotResult.value.snapshot,
      trendAnalysis: trendResult.value.trend,
      executiveDashboard: dashboardResult.value.dashboard,
      performanceHealthScore: healthScoreResult.value.healthScore,
      persisted: input.persisted,
    });
  }

  private async deleteOptionalAnalyticsProjection(input: {
    readonly context: ApplicationCommand["context"];
    readonly projectionType: AnalyticsProjectionType;
    readonly projectionId?: AnalyticsProjectionId;
  }): Promise<Result<boolean, AnalyticsApplicationError>> {
    if (!input.projectionId) {
      return success(false);
    }

    const result = await this.deleteAnalyticsProjection({
      commandType: "DeleteAnalyticsProjection",
      context: input.context,
      projectionType: input.projectionType,
      projectionId: input.projectionId,
    });

    if (!result.ok) {
      return failure(result.error);
    }

    return success(result.value.deleted);
  }

  private async publishAnalyticsEvent(
    source: AnalyticsIntegrationEventSource
  ): Promise<void> {
    if (!this.analyticsIntegrationEventPublisher) {
      return;
    }

    await this.analyticsIntegrationEventPublisher.publish(source);
  }
}

function assertProjectionBusiness(
  projection: AnalyticsProjection,
  businessId: CreateKPIInput["businessId"],
  message: string
): void {
  if (!businessId || getAnalyticsProjectionBusinessId(projection) !== businessId) {
    throw new Error(message);
  }
}

function mapAnalyticsApplicationError(
  error: unknown
): AnalyticsApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "KPI calculation failed validation.",
    cause: error,
  };
}
