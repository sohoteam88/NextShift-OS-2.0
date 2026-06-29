import type {
  BusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotId,
  BusinessPerformanceSnapshotReportingPeriod,
  CategorySummary,
  ExecutiveDashboard,
  ExecutiveDashboardId,
  ExecutiveSummary,
  KPI,
  KPIId,
  KPISnapshot,
  PerformanceHealthScore,
  PerformanceHealthScoreId,
  TrendAnalysis,
  TrendAnalysisId,
  WeightedHealthMetric,
} from "@nextshift/domain";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  Timestamp,
} from "@nextshift/shared";

export type AnalyticsIntegrationEventId = Brand<
  string,
  "AnalyticsIntegrationEventId"
>;

export type AnalyticsIntegrationEventType =
  | "KPICreated"
  | "BusinessPerformanceSnapshotCreated"
  | "TrendAnalysisCreated"
  | "ExecutiveDashboardCreated"
  | "PerformanceHealthScoreCreated"
  | "AnalyticsInsightBuilt";

export type AnalyticsIntegrationAggregateType =
  | "KPI"
  | "BusinessPerformanceSnapshot"
  | "TrendAnalysis"
  | "ExecutiveDashboard"
  | "PerformanceHealthScore"
  | "AnalyticsInsight";

export type AnalyticsIntegrationAggregateId =
  | KPIId
  | BusinessPerformanceSnapshotId
  | TrendAnalysisId
  | ExecutiveDashboardId
  | PerformanceHealthScoreId;

export interface KPICreated {
  readonly businessId?: BusinessId;
  readonly kpiId: KPIId;
  readonly name: string;
  readonly category: string;
  readonly targetValue: number;
  readonly actualValue?: number;
  readonly achievementPercentage?: number;
  readonly variance?: number;
  readonly status: string;
  readonly measurementDate: Timestamp;
}

export interface BusinessPerformanceSnapshotCreated {
  readonly businessId: BusinessId;
  readonly snapshotId: BusinessPerformanceSnapshotId;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly overallAchievement?: number;
  readonly overallStatus: string;
  readonly categorySummaries: readonly CategorySummary[];
}

export interface TrendAnalysisCreated {
  readonly businessId: BusinessId;
  readonly trendId: TrendAnalysisId;
  readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
  readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
  readonly baselinePeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly comparisonPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly overallGrowthRate: number;
  readonly overallTrend: string;
}

export interface ExecutiveDashboardCreated {
  readonly businessId: BusinessId;
  readonly dashboardId: ExecutiveDashboardId;
  readonly generatedAt: Timestamp;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly dashboardStatus: string;
  readonly executiveSummary: ExecutiveSummary;
}

export interface PerformanceHealthScoreCreated {
  readonly businessId: BusinessId;
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly generatedAt: Timestamp;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly overallScore: number;
  readonly healthGrade: string;
  readonly healthStatus: string;
  readonly weightedMetrics: readonly WeightedHealthMetric[];
}

export interface AnalyticsInsightBuilt {
  readonly businessId: BusinessId;
  readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
  readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
  readonly trendId: TrendAnalysisId;
  readonly dashboardId: ExecutiveDashboardId;
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly generatedAt: Timestamp;
  readonly persisted: true;
}

export type AnalyticsIntegrationPayload =
  | KPICreated
  | BusinessPerformanceSnapshotCreated
  | TrendAnalysisCreated
  | ExecutiveDashboardCreated
  | PerformanceHealthScoreCreated
  | AnalyticsInsightBuilt;

export interface AnalyticsIntegrationEvent {
  readonly integrationEventId: AnalyticsIntegrationEventId;
  readonly eventType: AnalyticsIntegrationEventType;
  readonly aggregateType: AnalyticsIntegrationAggregateType;
  readonly aggregateId: AnalyticsIntegrationAggregateId;
  readonly businessId?: BusinessId;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
  readonly version: 1;
  readonly payload: AnalyticsIntegrationPayload;
  readonly serializedPayload: string;
}

export interface AnalyticsIntegrationReplayStore {
  append(event: AnalyticsIntegrationEvent): Promise<void>;
  replay(): Promise<readonly AnalyticsIntegrationEvent[]>;
  replayByAggregate(
    aggregateType: AnalyticsIntegrationAggregateType,
    aggregateId: AnalyticsIntegrationAggregateId
  ): Promise<readonly AnalyticsIntegrationEvent[]>;
  replayByEventType(
    eventType: AnalyticsIntegrationEventType
  ): Promise<readonly AnalyticsIntegrationEvent[]>;
}

export type AnalyticsIntegrationEventSource =
  | {
      readonly eventType: "KPICreated";
      readonly kpi: KPI;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "BusinessPerformanceSnapshotCreated";
      readonly snapshot: BusinessPerformanceSnapshot;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "TrendAnalysisCreated";
      readonly trendAnalysis: TrendAnalysis;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "ExecutiveDashboardCreated";
      readonly dashboard: ExecutiveDashboard;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "PerformanceHealthScoreCreated";
      readonly healthScore: PerformanceHealthScore;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "AnalyticsInsightBuilt";
      readonly businessId: BusinessId;
      readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
      readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
      readonly trendId: TrendAnalysisId;
      readonly dashboardId: ExecutiveDashboardId;
      readonly healthScoreId: PerformanceHealthScoreId;
      readonly generatedAt: Timestamp;
      readonly persisted: true;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    };

type CreateAnalyticsIntegrationEventId = () => AnalyticsIntegrationEventId;

const defaultCreateAnalyticsIntegrationEventId:
  CreateAnalyticsIntegrationEventId = () =>
    crypto.randomUUID() as AnalyticsIntegrationEventId;

export class AnalyticsIntegrationEventMapper {
  constructor(
    private readonly createIntegrationEventId:
      CreateAnalyticsIntegrationEventId =
      defaultCreateAnalyticsIntegrationEventId
  ) {}

  map(source: AnalyticsIntegrationEventSource): AnalyticsIntegrationEvent {
    switch (source.eventType) {
      case "KPICreated":
        return this.mapKPICreated(source);
      case "BusinessPerformanceSnapshotCreated":
        return this.mapBusinessPerformanceSnapshotCreated(source);
      case "TrendAnalysisCreated":
        return this.mapTrendAnalysisCreated(source);
      case "ExecutiveDashboardCreated":
        return this.mapExecutiveDashboardCreated(source);
      case "PerformanceHealthScoreCreated":
        return this.mapPerformanceHealthScoreCreated(source);
      case "AnalyticsInsightBuilt":
        return this.mapAnalyticsInsightBuilt(source);
      default: {
        const unsupported = source as { readonly eventType?: string };
        throw new Error(
          `Unsupported analytics integration event: ${unsupported.eventType}.`
        );
      }
    }
  }

  private mapKPICreated(
    source: Extract<AnalyticsIntegrationEventSource, { readonly eventType: "KPICreated" }>
  ): AnalyticsIntegrationEvent {
    const snapshot = source.kpi.toSnapshot();
    const payload: KPICreated = freezeDeep({
      businessId: snapshot.businessId,
      kpiId: snapshot.kpiId,
      name: snapshot.name,
      category: snapshot.category,
      targetValue: snapshot.targetValue,
      actualValue: snapshot.actualValue,
      achievementPercentage: snapshot.achievementPercentage,
      variance: snapshot.variance,
      status: snapshot.status,
      measurementDate: snapshot.measurementDate,
    });

    return this.createEvent({
      eventType: "KPICreated",
      aggregateType: "KPI",
      aggregateId: snapshot.kpiId,
      businessId: snapshot.businessId,
      occurredAt: source.occurredAt ?? snapshot.measurementDate,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapBusinessPerformanceSnapshotCreated(
    source: Extract<
      AnalyticsIntegrationEventSource,
      { readonly eventType: "BusinessPerformanceSnapshotCreated" }
    >
  ): AnalyticsIntegrationEvent {
    const snapshot = source.snapshot.toSnapshot();
    const payload: BusinessPerformanceSnapshotCreated = freezeDeep({
      businessId: snapshot.businessId,
      snapshotId: snapshot.snapshotId,
      reportingPeriod: cloneDeep(snapshot.reportingPeriod),
      generatedAt: snapshot.generatedAt,
      overallAchievement: snapshot.overallAchievement,
      overallStatus: snapshot.overallStatus,
      categorySummaries: cloneDeep(snapshot.categorySummaries),
    });

    return this.createEvent({
      eventType: "BusinessPerformanceSnapshotCreated",
      aggregateType: "BusinessPerformanceSnapshot",
      aggregateId: snapshot.snapshotId,
      businessId: snapshot.businessId,
      occurredAt: source.occurredAt ?? snapshot.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapTrendAnalysisCreated(
    source: Extract<
      AnalyticsIntegrationEventSource,
      { readonly eventType: "TrendAnalysisCreated" }
    >
  ): AnalyticsIntegrationEvent {
    const snapshot = source.trendAnalysis.toSnapshot();
    const payload: TrendAnalysisCreated = freezeDeep({
      businessId: snapshot.businessId,
      trendId: snapshot.trendId,
      baselineSnapshotId: snapshot.baselineSnapshotId,
      comparisonSnapshotId: snapshot.comparisonSnapshotId,
      baselinePeriod: cloneDeep(snapshot.baselinePeriod),
      comparisonPeriod: cloneDeep(snapshot.comparisonPeriod),
      generatedAt: snapshot.generatedAt,
      overallGrowthRate: snapshot.overallGrowthRate,
      overallTrend: snapshot.overallTrend,
    });

    return this.createEvent({
      eventType: "TrendAnalysisCreated",
      aggregateType: "TrendAnalysis",
      aggregateId: snapshot.trendId,
      businessId: snapshot.businessId,
      occurredAt: source.occurredAt ?? snapshot.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapExecutiveDashboardCreated(
    source: Extract<
      AnalyticsIntegrationEventSource,
      { readonly eventType: "ExecutiveDashboardCreated" }
    >
  ): AnalyticsIntegrationEvent {
    const snapshot = source.dashboard.toSnapshot();
    const payload: ExecutiveDashboardCreated = freezeDeep({
      businessId: snapshot.businessId,
      dashboardId: snapshot.dashboardId,
      generatedAt: snapshot.generatedAt,
      reportingPeriod: cloneDeep(snapshot.reportingPeriod),
      dashboardStatus: snapshot.dashboardStatus,
      executiveSummary: cloneDeep(snapshot.executiveSummary),
    });

    return this.createEvent({
      eventType: "ExecutiveDashboardCreated",
      aggregateType: "ExecutiveDashboard",
      aggregateId: snapshot.dashboardId,
      businessId: snapshot.businessId,
      occurredAt: source.occurredAt ?? snapshot.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapPerformanceHealthScoreCreated(
    source: Extract<
      AnalyticsIntegrationEventSource,
      { readonly eventType: "PerformanceHealthScoreCreated" }
    >
  ): AnalyticsIntegrationEvent {
    const snapshot = source.healthScore.toSnapshot();
    const payload: PerformanceHealthScoreCreated = freezeDeep({
      businessId: snapshot.businessId,
      healthScoreId: snapshot.healthScoreId,
      generatedAt: snapshot.generatedAt,
      reportingPeriod: cloneDeep(snapshot.reportingPeriod),
      overallScore: snapshot.overallScore,
      healthGrade: snapshot.healthGrade,
      healthStatus: snapshot.healthStatus,
      weightedMetrics: cloneDeep(snapshot.weightedMetrics),
    });

    return this.createEvent({
      eventType: "PerformanceHealthScoreCreated",
      aggregateType: "PerformanceHealthScore",
      aggregateId: snapshot.healthScoreId,
      businessId: snapshot.businessId,
      occurredAt: source.occurredAt ?? snapshot.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapAnalyticsInsightBuilt(
    source: Extract<
      AnalyticsIntegrationEventSource,
      { readonly eventType: "AnalyticsInsightBuilt" }
    >
  ): AnalyticsIntegrationEvent {
    const payload: AnalyticsInsightBuilt = freezeDeep({
      businessId: source.businessId,
      baselineSnapshotId: source.baselineSnapshotId,
      comparisonSnapshotId: source.comparisonSnapshotId,
      trendId: source.trendId,
      dashboardId: source.dashboardId,
      healthScoreId: source.healthScoreId,
      generatedAt: source.generatedAt,
      persisted: source.persisted,
    });

    return this.createEvent({
      eventType: "AnalyticsInsightBuilt",
      aggregateType: "AnalyticsInsight",
      aggregateId: source.healthScoreId,
      businessId: source.businessId,
      occurredAt: source.occurredAt ?? source.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private createEvent(input: {
    readonly eventType: AnalyticsIntegrationEventType;
    readonly aggregateType: AnalyticsIntegrationAggregateType;
    readonly aggregateId: AnalyticsIntegrationAggregateId;
    readonly businessId?: BusinessId;
    readonly occurredAt: Timestamp;
    readonly correlationId?: CorrelationId;
    readonly causationId?: CausationId;
    readonly payload: AnalyticsIntegrationPayload;
  }): AnalyticsIntegrationEvent {
    return freezeDeep({
      integrationEventId: this.createIntegrationEventId(),
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      businessId: input.businessId,
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      causationId: input.causationId,
      version: 1,
      payload: input.payload,
      serializedPayload: JSON.stringify(input.payload),
    });
  }
}

export class InMemoryAnalyticsIntegrationReplayStore
  implements AnalyticsIntegrationReplayStore
{
  private readonly events: AnalyticsIntegrationEvent[] = [];

  async append(event: AnalyticsIntegrationEvent): Promise<void> {
    this.events.push(cloneAnalyticsIntegrationEvent(event));
  }

  async replay(): Promise<readonly AnalyticsIntegrationEvent[]> {
    return freezeList(this.events.map(cloneAnalyticsIntegrationEvent));
  }

  async replayByAggregate(
    aggregateType: AnalyticsIntegrationAggregateType,
    aggregateId: AnalyticsIntegrationAggregateId
  ): Promise<readonly AnalyticsIntegrationEvent[]> {
    return freezeList(
      this.events
        .filter(
          (event) =>
            event.aggregateType === aggregateType &&
            event.aggregateId === aggregateId
        )
        .map(cloneAnalyticsIntegrationEvent)
    );
  }

  async replayByEventType(
    eventType: AnalyticsIntegrationEventType
  ): Promise<readonly AnalyticsIntegrationEvent[]> {
    return freezeList(
      this.events
        .filter((event) => event.eventType === eventType)
        .map(cloneAnalyticsIntegrationEvent)
    );
  }
}

export class AnalyticsIntegrationEventPublisher {
  constructor(
    private readonly replayStore: AnalyticsIntegrationReplayStore,
    private readonly mapper: AnalyticsIntegrationEventMapper =
      new AnalyticsIntegrationEventMapper()
  ) {}

  async publish(
    source: AnalyticsIntegrationEventSource
  ): Promise<AnalyticsIntegrationEvent> {
    const integrationEvent = this.mapper.map(source);
    await this.replayStore.append(integrationEvent);
    return cloneAnalyticsIntegrationEvent(integrationEvent);
  }

  async publishMany(
    sources: readonly AnalyticsIntegrationEventSource[]
  ): Promise<readonly AnalyticsIntegrationEvent[]> {
    const integrationEvents: AnalyticsIntegrationEvent[] = [];

    for (const source of sources) {
      integrationEvents.push(await this.publish(source));
    }

    return freezeList(integrationEvents.map(cloneAnalyticsIntegrationEvent));
  }
}

function cloneAnalyticsIntegrationEvent(
  event: AnalyticsIntegrationEvent
): AnalyticsIntegrationEvent {
  return freezeDeep({
    integrationEventId: event.integrationEventId,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    businessId: event.businessId,
    occurredAt: event.occurredAt,
    correlationId: event.correlationId,
    causationId: event.causationId,
    version: event.version,
    payload: freezeDeep(cloneDeep(event.payload)),
    serializedPayload: event.serializedPayload,
  });
}

function freezeList<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      clone[key] = cloneDeep(child);
    }

    return clone as T;
  }

  return value;
}

function freezeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeDeep(item);
    }

    return Object.freeze(value) as T;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }

    return Object.freeze(value) as T;
  }

  return value;
}
