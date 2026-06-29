import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  KPI,
  KPICalculator,
  type KPIId,
  type KPIDefinitionId,
} from "../src";
import {
  KPI as PublicKPI,
  KPICalculator as PublicKPICalculator,
} from "../src/analytics";

const kpiId = "kpi-1" as KPIId;
const businessId = "business-1" as BusinessId;

function createKPI(input: {
  readonly actualValue?: number;
  readonly targetValue?: number;
  readonly name?: string;
  readonly category?: string;
  readonly unit?: string;
}) {
  return KPI.create({
    kpiId,
    businessId,
    definitionId: "definition-1" as KPIDefinitionId,
    name: input.name ?? "Revenue Growth",
    category: input.category ?? "Revenue",
    targetValue: input.targetValue ?? 100,
    actualValue: input.actualValue,
    unit: input.unit ?? "USD",
    measurementDate: "2026-06-28T00:00:00.000Z",
  });
}

describe("KPI", () => {
  it("creates immutable KPI snapshots with derived values", () => {
    const kpi = createKPI({ actualValue: 80 });

    expect(kpi.toSnapshot()).toMatchObject({
      kpiId,
      businessId,
      name: "Revenue Growth",
      category: "Revenue",
      targetValue: 100,
      actualValue: 80,
      unit: "USD",
      achievementPercentage: 80,
      variance: -20,
      status: "OnTrack",
    });
  });

  it("normalizes supported categories", () => {
    expect(createKPI({ category: "crm" }).toSnapshot().category).toBe("CRM");
    expect(createKPI({ category: "business" }).toSnapshot().category).toBe(
      "Business"
    );
  });

  it("returns Pending when actual value is absent", () => {
    const kpi = createKPI({});

    expect(kpi.toSnapshot()).toMatchObject({
      actualValue: undefined,
      achievementPercentage: undefined,
      variance: undefined,
      status: "Pending",
    });
  });

  it("returns Warning below 70 percent", () => {
    expect(createKPI({ actualValue: 69 }).toSnapshot()).toMatchObject({
      achievementPercentage: 69,
      variance: -31,
      status: "Warning",
    });
  });

  it("returns OnTrack from 70 through below 100 percent", () => {
    expect(createKPI({ actualValue: 70 }).toSnapshot().status).toBe("OnTrack");
    expect(
      createKPI({ actualValue: 9999, targetValue: 10000 }).toSnapshot()
        .status
    ).toBe("OnTrack");
  });

  it("returns Achieved at exactly 100 percent", () => {
    expect(createKPI({ actualValue: 100 }).toSnapshot()).toMatchObject({
      achievementPercentage: 100,
      variance: 0,
      status: "Achieved",
    });
  });

  it("returns Exceeded above 100 percent", () => {
    expect(createKPI({ actualValue: 125 }).toSnapshot()).toMatchObject({
      achievementPercentage: 125,
      variance: 25,
      status: "Exceeded",
    });
  });

  it("rejects invalid inputs", () => {
    expect(() => createKPI({ name: " " })).toThrow("KPI name is required.");
    expect(() => createKPI({ category: "Finance" })).toThrow(
      "Unsupported KPI category: Finance."
    );
    expect(() => createKPI({ targetValue: 0 })).toThrow(
      "KPI target value must be greater than zero."
    );
    expect(() => createKPI({ actualValue: -1 })).toThrow(
      "KPI actual value must be zero or greater."
    );
    expect(() => createKPI({ unit: " " })).toThrow("KPI unit is required.");
  });

  it("calculates deterministically through the calculator", () => {
    const calculator = new KPICalculator();
    const input = {
      kpiId,
      name: "Lead Conversion",
      category: "CRM",
      targetValue: 100,
      actualValue: 75,
      unit: "count",
      measurementDate: "2026-06-28T00:00:00.000Z",
    };

    expect(calculator.calculate(input).toSnapshot()).toEqual(
      calculator.calculate(input).toSnapshot()
    );
  });

  it("exports KPI primitives from the analytics module", () => {
    expect(PublicKPI).toBe(KPI);
    expect(PublicKPICalculator).toBe(KPICalculator);
  });
});
