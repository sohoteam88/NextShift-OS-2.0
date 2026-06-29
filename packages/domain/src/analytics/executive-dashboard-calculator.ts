import {
  ExecutiveDashboard,
  type CreateExecutiveDashboardInput,
} from "./executive-dashboard";

export class ExecutiveDashboardCalculator {
  calculate(input: CreateExecutiveDashboardInput): ExecutiveDashboard {
    return ExecutiveDashboard.create(input);
  }
}
