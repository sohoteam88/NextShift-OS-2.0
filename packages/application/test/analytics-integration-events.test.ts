import {
  BusinessPerformanceSnapshot,
  ExecutiveDashboard,
  InMemoryAnalyticsRepository,
  KPI,
  PerformanceHealthScore,
  TrendAnalysis,
  type BusinessPerformanceSnapshotId,
  type ExecutiveDashboardId,
  type KPIId,
  type PerformanceHealthScoreId,
  type TrendAnalysisId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  AnalyticsApplicationService,
  AnalyticsIntegrationEventMapper,
  AnalyticsIntegrationEventPublisher,
  AnalyticsIntegrationEventPublisher as PublicAnalyticsIntegrationEventPublisher,
  InMemoryAnalyticsIntegrationReplayStore,
  InMemoryAnalyticsIntegrationReplayStore as PublicInMemoryAnalyticsIntegrationReplayStore,
  type AnalyticsIntegrationEventId,
  type AnalyticsIntegrationEventSource,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

const baselineReportingPeriod = {
  start: "2026-05-01T00:00:00.000Z",
  end: "2026-06-01T00:00:00.000Z",
};

const comparisonReportingPeriod = {
  start: "2026-06-01T00:00:00.000Z",
  end: "2026-07-01T00:00:00.000Z",
};

describe("AnalyticsIntegrationEventMapper", () => {
  it("maps every analytics event type into immutable integration events", () => {
    const mapper = new AnalyticsIntegrationEventMapper(
      nextAnalyticsIntegrationEventId()
    );

    const mapped = sampleEventSources().map((source) => mapper.map(source));

    expect(mapped.map((event) => event.eventType)).toEqual([
      "KPICreated",
      "BusinessPerformanceSnapshotCreated",
      "TrendAnalysisCreated",
      "ExecutiveDashboardCreated",
      "PerformanceHealthScoreCreated",
      "AnalyticsInsightBuilt",
    ]);
    expect(mapped[0]).toMatchObject({
      integrationEventId: "analytics-integration-event-1",
      eventType: "KPICreated",
      aggregateType: "KPI",
      aggregateId: "kpi-1",
      businessId,
      version: 1,
      payload: {
        businessId,
        kpiId: "kpi-1",
        achievementPercentage: 100,
        status: "Achieved",
      },
    });
    expect(mapped.at(-1)).toMatchObject({
      eventType: "AnalyticsInsightBuilt",
      aggregateType: "AnalyticsInsight",
      aggregateId: "health-score-1",
      payload: {
        businessId,
        baselineSnapshotId: "snapshot-baseline",
        comparisonSnapshotId: "snapshot-comparison",
        persisted: true,
      },
    });
    expect(Object.isFrozen(mapped[0])).toBe(true);
    expect(Object.isFrozen(mapped[0]?.payload)).toBe(true);
    expect(Object.isFrozen(mapped[1]?.payload)).toBe(true);
    expect(Object.isFrozen(mapped[1]?.payload)).toBe(true);
    expect(mapped[0]?.serializedPayload).toBe(
      JSON.stringify(mapped[0]?.payload)
    );
  });

  it("rejects unsupported event types defensively", () => {
    const mapper = new AnalyticsIntegrationEventMapper(
      () => "analytics-integration-event-1" as AnalyticsIntegrationEventId
    );

    expect(() =>
      mapper.map({
        eventType: "UnsupportedAnalyticsEvent",
      } as unknown as AnalyticsIntegrationEventSource)
    ).toThrow("Unsupported analytics integration event: UnsupportedAnalyticsEvent.");
  });
});

describe("AnalyticsIntegrationEventPublisher", () => {
  it("publishes mapped events into the replay store", async () => {
    const store = new InMemoryAnalyticsIntegrationReplayStore();
    const publisher = new AnalyticsIntegrationEventPublisher(
      store,
      new AnalyticsIntegrationEventMapper(
        () => "analytics-integration-event-1" as AnalyticsIntegrationEventId
      )
    );

    const integrationEvent = await publisher.publish(sampleEventSources()[0]);

    expect(integrationEvent).toMatchObject({
      integrationEventId: "analytics-integration-event-1",
      eventType: "KPICreated",
    });
    await expect(store.replay()).resolves.toMatchObject([
      {
        integrationEventId: "analytics-integration-event-1",
        eventType: "KPICreated",
      },
    ]);
  });

  it("preserves replay ordering and supports replay filters", async () => {
    const store = new InMemoryAnalyticsIntegrationReplayStore();
    const publisher = new AnalyticsIntegrationEventPublisher(
      store,
      new AnalyticsIntegrationEventMapper(nextAnalyticsIntegrationEventId())
    );

    await publisher.publishMany([
      sampleEventSources()[1],
      sampleEventSources()[2],
      sampleEventSources()[3],
    ]);

    const replayed = await store.replay();

    expect(replayed.map((event) => event.eventType)).toEqual([
      "BusinessPerformanceSnapshotCreated",
      "TrendAnalysisCreated",
      "ExecutiveDashboardCreated",
    ]);
    await expect(
      store.replayByAggregate(
        "TrendAnalysis",
        "trend-1" as TrendAnalysisId
      )
    ).resolves.toMatchObject([{ eventType: "TrendAnalysisCreated" }]);
    await expect(
      store.replayByEventType("ExecutiveDashboardCreated")
    ).resolves.toMatchObject([{ aggregateId: "dashboard-1" }]);
  });

  it("returns immutable replay output", async () => {
    const store = new InMemoryAnalyticsIntegrationReplayStore();
    const publisher = new AnalyticsIntegrationEventPublisher(
      store,
      new AnalyticsIntegrationEventMapper(nextAnalyticsIntegrationEventId())
    );

    await publisher.publish(sampleEventSources()[4]);

    const replayed = await store.replay();
    const payload = replayed[0]?.payload as {
      readonly weightedMetrics: readonly unknown[];
    };

    expect(Object.isFrozen(replayed)).toBe(true);
    expect(Object.isFrozen(replayed[0])).toBe(true);
    expect(Object.isFrozen(replayed[0]?.payload)).toBe(true);
    expect(Object.isFrozen(payload.weightedMetrics)).toBe(true);
  });
});

describe("AnalyticsApplicationService integration event publication", () => {
  it("publishes events after successful create workflows", async () => {
    const { service, store } = serviceWithPublisher();
    const baseline = baselineSnapshot();
    const comparison = comparisonSnapshot();
    const trend = createTrend(baseline, comparison);
    const dashboard = createDashboard(comparison, trend);

    await service.createKPI({
      commandType: "CreateKPI",
      context,
      kpiId: "kpi-created" as KPIId,
      name: "KPI",
      category: "Revenue",
      targetValue: 100,
      actualValue: 100,
      unit: "points",
      measurementDate: "2026-06-28T00:00:00.000Z",
    });
    await service.createBusinessPerformanceSnapshot({
      commandType: "CreateBusinessPerformanceSnapshot",
      context,
      snapshotId: "snapshot-created" as BusinessPerformanceSnapshotId,
      reportingPeriod: comparisonReportingPeriod,
      generatedAt: "2026-07-01T00:00:00.000Z",
      kpis: [createKPI({ id: "snapshot-created-kpi", actualValue: 100 })],
    });
    await service.createTrendAnalysis({
      commandType: "CreateTrendAnalysis",
      context,
      trendId: "trend-created" as TrendAnalysisId,
      baselineSnapshot: baseline,
      comparisonSnapshot: comparison,
      generatedAt: "2026-07-01T00:00:00.000Z",
    });
    await service.createExecutiveDashboard({
      commandType: "CreateExecutiveDashboard",
      context,
      dashboardId: "dashboard-created" as ExecutiveDashboardId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      performanceSnapshot: comparison,
      trendAnalysis: trend,
    });
    await service.createPerformanceHealthScore({
      commandType: "CreatePerformanceHealthScore",
      context,
      healthScoreId: "health-score-created" as PerformanceHealthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      executiveDashboard: dashboard,
    });

    const replayed = await store.replay();

    expect(replayed.map((event) => event.eventType)).toEqual([
      "KPICreated",
      "BusinessPerformanceSnapshotCreated",
      "TrendAnalysisCreated",
      "ExecutiveDashboardCreated",
      "PerformanceHealthScoreCreated",
    ]);
  });

  it("publishes AnalyticsInsightBuilt only after persisted build succeeds", async () => {
    const { service, store } = serviceWithPublisher();

    const result = await service.buildAnalyticsInsight(buildCommand());

    expect(result.ok).toBe(true);

    const replayed = await store.replay();

    expect(replayed.map((event) => event.eventType)).toEqual([
      "AnalyticsInsightBuilt",
    ]);
    expect(replayed[0]).toMatchObject({
      aggregateType: "AnalyticsInsight",
      aggregateId: "health-score-1",
      payload: {
        persisted: true,
      },
    });
  });

  it("does not publish events for failed workflows", async () => {
    const { service, store } = serviceWithPublisher();

    const result = await service.createKPI({
      commandType: "CreateKPI",
      context,
      kpiId: "failed-kpi" as KPIId,
      name: "KPI",
      category: "Unsupported",
      targetValue: 100,
      actualValue: 100,
      unit: "points",
      measurementDate: "2026-06-28T00:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    await expect(store.replay()).resolves.toHaveLength(0);
  });

  it("does not publish events for evaluate-only workflows", async () => {
    const { service, store } = serviceWithPublisher();

    await service.evaluateKPI({
      queryType: "EvaluateKPI",
      context,
      kpi: {
        kpiId: "evaluate-kpi" as KPIId,
        name: "KPI",
        category: "Revenue",
        targetValue: 100,
        actualValue: 100,
        unit: "points",
        measurementDate: "2026-06-28T00:00:00.000Z",
      },
    });
    await service.evaluateAnalyticsInsight(evaluateQuery());

    await expect(store.replay()).resolves.toHaveLength(0);
  });

  it("does not publish AnalyticsInsightBuilt for non-persisted build", async () => {
    const { service, store } = serviceWithPublisher();

    const result = await service.buildAnalyticsInsight(
      buildCommand({ persist: false })
    );

    expect(result.ok).toBe(true);
    await expect(store.replay()).resolves.toHaveLength(0);
  });

  it("keeps existing analytics APIs and public exports available", () => {
    const { service } = serviceWithPublisher();

    expect(service.createKPI).toEqual(expect.any(Function));
    expect(service.evaluateKPI).toEqual(expect.any(Function));
    expect(service.createBusinessPerformanceSnapshot).toEqual(expect.any(Function));
    expect(service.evaluateBusinessPerformanceSnapshot).toEqual(
      expect.any(Function)
    );
    expect(service.createTrendAnalysis).toEqual(expect.any(Function));
    expect(service.evaluateTrendAnalysis).toEqual(expect.any(Function));
    expect(service.createExecutiveDashboard).toEqual(expect.any(Function));
    expect(service.evaluateExecutiveDashboard).toEqual(expect.any(Function));
    expect(service.createPerformanceHealthScore).toEqual(expect.any(Function));
    expect(service.evaluatePerformanceHealthScore).toEqual(expect.any(Function));
    expect(service.buildAnalyticsInsight).toEqual(expect.any(Function));
    expect(service.evaluateAnalyticsInsight).toEqual(expect.any(Function));
    expect(PublicAnalyticsIntegrationEventPublisher).toBe(
      AnalyticsIntegrationEventPublisher
    );
    expect(PublicInMemoryAnalyticsIntegrationReplayStore).toBe(
      InMemoryAnalyticsIntegrationReplayStore
    );
  });
});

function serviceWithPublisher() {
  const store = new InMemoryAnalyticsIntegrationReplayStore();
  const publisher = new AnalyticsIntegrationEventPublisher(
    store,
    new AnalyticsIntegrationEventMapper(nextAnalyticsIntegrationEventId())
  );
  const service = new AnalyticsApplicationService(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    new InMemoryAnalyticsRepository(),
    publisher
  );

  return { service, store };
}

function nextAnalyticsIntegrationEventId() {
  let sequence = 0;

  return () => {
    sequence += 1;
    return `analytics-integration-event-${sequence}` as AnalyticsIntegrationEventId;
  };
}

function sampleEventSources(): AnalyticsIntegrationEventSource[] {
  const baseline = baselineSnapshot();
  const comparison = comparisonSnapshot();
  const trend = createTrend(baseline, comparison);
  const dashboard = createDashboard(comparison, trend);
  const healthScore = createHealthScore(dashboard);

  return [
    {
      eventType: "KPICreated",
      kpi: createKPI({ id: "kpi-1", actualValue: 100 }),
    },
    {
      eventType: "BusinessPerformanceSnapshotCreated",
      snapshot: comparison,
    },
    {
      eventType: "TrendAnalysisCreated",
      trendAnalysis: trend,
    },
    {
      eventType: "ExecutiveDashboardCreated",
      dashboard,
    },
    {
      eventType: "PerformanceHealthScoreCreated",
      healthScore,
    },
    {
      eventType: "AnalyticsInsightBuilt",
      businessId,
      baselineSnapshotId: baseline.snapshotId,
      comparisonSnapshotId: comparison.snapshotId,
      trendId: trend.trendId,
      dashboardId: dashboard.dashboardId,
      healthScoreId: healthScore.healthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      persisted: true,
    },
  ];
}

function createKPI(input: {
  readonly id: string;
  readonly actualValue: number;
  readonly businessId?: BusinessId;
}) {
  return KPI.create({
    kpiId: input.id as KPIId,
    businessId: input.businessId ?? businessId,
    name: "KPI",
    category: "Revenue",
    targetValue: 100,
    actualValue: input.actualValue,
    unit: "points",
    measurementDate: "2026-06-28T00:00:00.000Z",
  });
}

function createSnapshot(input: {
  readonly id: string;
  readonly start: string;
  readonly end: string;
  readonly actualValue: number;
  readonly businessId?: BusinessId;
}) {
  return BusinessPerformanceSnapshot.create({
    snapshotId: input.id as BusinessPerformanceSnapshotId,
    businessId: input.businessId ?? businessId,
    reportingPeriod: {
      start: input.start,
      end: input.end,
    },
    generatedAt: input.end,
    kpis: [
      createKPI({
        id: `${input.id}-kpi`,
        actualValue: input.actualValue,
        businessId: input.businessId,
      }),
    ],
  });
}

function baselineSnapshot(input?: { readonly businessId?: BusinessId }) {
  return createSnapshot({
    id: "snapshot-baseline",
    start: baselineReportingPeriod.start,
    end: baselineReportingPeriod.end,
    actualValue: 80,
    businessId: input?.businessId,
  });
}

function comparisonSnapshot(input?: { readonly businessId?: BusinessId }) {
  return createSnapshot({
    id: "snapshot-comparison",
    start: comparisonReportingPeriod.start,
    end: comparisonReportingPeriod.end,
    actualValue: 100,
    businessId: input?.businessId,
  });
}

function createTrend(
  baseline = baselineSnapshot(),
  comparison = comparisonSnapshot()
) {
  return TrendAnalysis.create({
    trendId: "trend-1" as TrendAnalysisId,
    baselineSnapshot: baseline,
    comparisonSnapshot: comparison,
    generatedAt: "2026-07-01T00:00:00.000Z",
  });
}

function createDashboard(
  comparison = comparisonSnapshot(),
  trend = createTrend(baselineSnapshot(), comparison)
) {
  return ExecutiveDashboard.create({
    dashboardId: "dashboard-1" as ExecutiveDashboardId,
    generatedAt: "2026-07-01T00:00:00.000Z",
    performanceSnapshot: comparison,
    trendAnalysis: trend,
  });
}

function createHealthScore(dashboard = createDashboard()) {
  return PerformanceHealthScore.create({
    healthScoreId: "health-score-1" as PerformanceHealthScoreId,
    generatedAt: "2026-07-01T00:00:00.000Z",
    executiveDashboard: dashboard,
  });
}

function buildCommand(input?: { readonly persist?: boolean }) {
  return {
    commandType: "BuildAnalyticsInsight" as const,
    context,
    baselineSnapshotId: "snapshot-baseline" as BusinessPerformanceSnapshotId,
    comparisonSnapshotId:
      "snapshot-comparison" as BusinessPerformanceSnapshotId,
    trendId: "trend-1" as TrendAnalysisId,
    dashboardId: "dashboard-1" as ExecutiveDashboardId,
    healthScoreId: "health-score-1" as PerformanceHealthScoreId,
    baselineReportingPeriod,
    comparisonReportingPeriod,
    generatedAt: "2026-07-01T00:00:00.000Z",
    baselineKPIs: [createKPI({ id: "baseline-kpi", actualValue: 80 })],
    comparisonKPIs: [createKPI({ id: "comparison-kpi", actualValue: 100 })],
    persist: input?.persist ?? true,
  };
}

function evaluateQuery() {
  const command = buildCommand({ persist: false });

  return {
    queryType: "EvaluateAnalyticsInsight" as const,
    context,
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
  };
}
