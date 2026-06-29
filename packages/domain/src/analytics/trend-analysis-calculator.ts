import {
  TrendAnalysis,
  type CreateTrendAnalysisInput,
} from "./trend-analysis";

export class TrendAnalysisCalculator {
  calculate(input: CreateTrendAnalysisInput): TrendAnalysis {
    return TrendAnalysis.create(input);
  }
}
