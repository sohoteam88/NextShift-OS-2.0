import {
  PerformanceHealthScore,
  type CreatePerformanceHealthScoreInput,
} from "./performance-health-score";

export class PerformanceHealthScoreCalculator {
  calculate(input: CreatePerformanceHealthScoreInput): PerformanceHealthScore {
    return PerformanceHealthScore.create(input);
  }
}
