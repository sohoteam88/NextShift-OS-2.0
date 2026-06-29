export interface DecisionBrainError {
  readonly code: string;
  readonly message: string;
}

export type DecisionBrainResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly error: DecisionBrainError;
    };

export function createDecisionBrainSuccess<T>(value: T): DecisionBrainResult<T> {
  return Object.freeze({
    ok: true,
    value,
  });
}

export function createDecisionBrainFailure(
  code: string,
  error: unknown
): DecisionBrainResult<never> {
  return Object.freeze({
    ok: false,
    error: Object.freeze({
      code,
      message: error instanceof Error ? error.message : String(error),
    }),
  });
}
