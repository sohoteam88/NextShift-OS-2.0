import businessPackData from './data/business-pack.json';
import { businessPackSchema, type BusinessPack } from './types';

/** Loads the committed pack once and rejects malformed data during module initialization. */
export function loadBusinessPack(): BusinessPack {
  const result = businessPackSchema.safeParse(businessPackData);

  if (!result.success) {
    throw new Error(`Invalid business-pack data: ${result.error.message}`);
  }

  return result.data;
}

export const businessPack = loadBusinessPack();
