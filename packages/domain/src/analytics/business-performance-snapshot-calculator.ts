import {
  BusinessPerformanceSnapshot,
  type CreateBusinessPerformanceSnapshotInput,
} from "./business-performance-snapshot";

export class BusinessPerformanceSnapshotCalculator {
  calculate(
    input: CreateBusinessPerformanceSnapshotInput
  ): BusinessPerformanceSnapshot {
    return BusinessPerformanceSnapshot.create(input);
  }
}
