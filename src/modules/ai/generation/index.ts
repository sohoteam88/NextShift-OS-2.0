export {
  buildGenerationContext,
  composeGenerationSystemPrompt,
  PLATFORM_CHARACTERISTICS,
} from './context';
export { runGeneration } from './gateway';
export { GENERATION_DEGRADE_LABEL } from './types';
export type {
  BuildGenerationContextOptions,
  BusinessPackSlice,
  GenerationContext,
  GenerationOutcome,
  GenerationPlatform,
  PlatformCharacteristics,
  RoutedGenerationResult,
  RunGenerationOptions,
} from './types';
