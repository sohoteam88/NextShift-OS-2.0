import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: prismaMocks }));

import { GET as getLiveness } from "@/app/api/health/route";
import { GET as getReadiness } from "@/app/api/v1/health/route";

const readinessRequest = () => new Request("https://example.com/api/v1/health");

describe("health and readiness contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("readiness_database_ok_returns_200", async () => {
    prismaMocks.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await getReadiness(readinessRequest() as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      services: { database: "ok" },
    });
  });

  it("readiness_database_failure_returns_503", async () => {
    prismaMocks.$queryRaw.mockRejectedValue(new Error("database unavailable"));

    const response = await getReadiness(readinessRequest() as never);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "degraded",
      services: { database: "error" },
    });
  });

  it("readiness_failure_does_not_leak_error_or_secret", async () => {
    const sensitiveValues = [
      "postgresql://db-user:db-password@private-db.example:5432/nextshift",
      "private-db.example",
      "db-user",
      "db-password",
      "P1001",
    ];
    prismaMocks.$queryRaw.mockRejectedValue(
      new Error(`Prisma P1001: cannot reach ${sensitiveValues[0]}`),
    );

    const response = await getReadiness(readinessRequest() as never);
    const body = await response.text();

    expect(response.status).toBe(503);
    for (const sensitiveValue of sensitiveValues) {
      expect(body).not.toContain(sensitiveValue);
    }
    expect(JSON.parse(body)).toEqual(
      expect.objectContaining({
        status: "degraded",
        services: { database: "error" },
      }),
    );
  });

  it("readiness_responses_are_no_store", async () => {
    prismaMocks.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const success = await getReadiness(readinessRequest() as never);

    prismaMocks.$queryRaw.mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    const failure = await getReadiness(readinessRequest() as never);

    for (const response of [success, failure]) {
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("cache-control")).toContain("no-cache");
    }
  });

  it("liveness_remains_database_independent", async () => {
    prismaMocks.$queryRaw.mockRejectedValue(new Error("database unavailable"));

    const response = getLiveness();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("cache-control")).toContain("no-cache");
    expect(prismaMocks.$queryRaw).not.toHaveBeenCalled();
  });
});
