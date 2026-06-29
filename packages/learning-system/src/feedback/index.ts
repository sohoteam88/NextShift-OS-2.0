export interface FeedbackSignal {
  readonly feedbackId: string;
  readonly source: "user" | "agent" | "system";
  readonly message: string;
}

export interface FeedbackProcessorPort {
  processFeedback(signal: FeedbackSignal): Promise<void>;
}
