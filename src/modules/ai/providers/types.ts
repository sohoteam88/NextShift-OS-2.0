export interface AIGenerateParams {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
}

export type AIProviderName = 'anthropic' | 'openai' | 'deepseek' | 'minimax' | 'gemini';

export interface AIGenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: AIProviderName;
  durationMs: number;
}

export interface AIStreamChunk {
  text: string;
  done: boolean;
}

export interface AIProvider {
  readonly name: AIProviderName;
  generateText(params: AIGenerateParams): Promise<AIGenerateResult>;
  generateStream(params: AIGenerateParams): AsyncGenerator<AIStreamChunk>;
}
