import type { RuntimeState } from '../contracts/RuntimeState';
import { assembleRuntimeState } from '../adapters/RuntimeStateAssembler';

export const runtimeStateService = {
  async getRuntimeState(userId: string): Promise<RuntimeState> {
    return assembleRuntimeState(userId);
  },
};

export async function getRuntimeState(userId: string): Promise<RuntimeState> {
  return runtimeStateService.getRuntimeState(userId);
}
