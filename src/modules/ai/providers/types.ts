export interface AIGenerateParams {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIGenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: 'anthropic' | 'openai';
  durationMs: number;
}

export interface AIStreamChunk {
  text: string;
  done: boolean;
}

export interface AIProvider {
  readonly name: 'anthropic' | 'openai';
  generateText(params: AIGenerateParams): Promise<AIGenerateResult>;
  generateStream(params: AIGenerateParams): AsyncGenerator<AIStreamChunk>;
}
