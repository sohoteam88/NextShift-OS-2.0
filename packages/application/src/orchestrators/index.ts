import type { Result } from "@nextshift/shared";
import type { ApplicationContext } from "../context";

export interface ApplicationOrchestrator<TInput, TOutput> {
  orchestrate(input: TInput, context: ApplicationContext): Promise<Result<TOutput>>;
}
