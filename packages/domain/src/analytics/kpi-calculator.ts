import { KPI, type CreateKPIInput } from "./kpi";

export class KPICalculator {
  calculate(input: CreateKPIInput): KPI {
    return KPI.create(input);
  }
}
