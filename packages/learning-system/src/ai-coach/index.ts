export interface CoachingInsight {
  readonly insightId: string;
  readonly message: string;
}

export interface AICoachPort {
  generateInsight(input: unknown): Promise<CoachingInsight>;
}
