export type RuntimeDiagnosticsHealth = "healthy" | "degraded" | "unhealthy";
export type RuntimeDiagnosticsStatus = "ok" | "warning" | "critical";

export function isRuntimeDiagnosticsHealth(
  value: unknown
): value is RuntimeDiagnosticsHealth {
  return value === "healthy" || value === "degraded" || value === "unhealthy";
}

export function isRuntimeDiagnosticsStatus(
  value: unknown
): value is RuntimeDiagnosticsStatus {
  return value === "ok" || value === "warning" || value === "critical";
}
