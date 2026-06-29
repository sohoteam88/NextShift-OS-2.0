import type { ApplicationContext } from "../context";

export interface ApplicationCommand {
  readonly context: ApplicationContext;
  readonly commandType: string;
}

export interface CommandHandler<TCommand extends ApplicationCommand, TResult> {
  handle(command: TCommand): Promise<TResult>;
}
