export type Timestamp = string;

export interface DateRange {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface Duration {
  readonly milliseconds: number;
}
