import type { Result } from "@nextshift/shared";
import type { ApplicationContext } from "../context";

export interface UseCase<TInput, TOutput> {
  execute(input: TInput, context: ApplicationContext): Promise<Result<TOutput>>;
}
