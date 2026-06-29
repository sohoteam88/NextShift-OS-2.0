import type { ApplicationContext } from "../context";

export interface ApplicationQuery {
  readonly context: ApplicationContext;
  readonly queryType: string;
}

export interface QueryHandler<TQuery extends ApplicationQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}
