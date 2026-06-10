import OpenAI from 'openai';
import type { AIProvider, AIGenerateParams, AIGenerateResult, AIStreamChunk } from './types';

export class DeepSeekProvider implements AIProvider {
  readonly name = 'deepseek' as const;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  async generateText(params: AIGenerateParams): Promise<AIGenerateResult> {
    const model = params.model ?? 'deepseek-chat';
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.7,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
    });

    return {
      text: response.choices[0]?.message?.content ?? '',
      tokensIn: response.usage?.prompt_tokens ?? 0,
      tokensOut: response.usage?.completion_tokens ?? 0,
      model,
      provider: 'deepseek',
      durationMs: Date.now() - start,
    };
  }

  async *generateStream(params: AIGenerateParams): AsyncGenerator<AIStreamChunk> {
    const model = params.model ?? 'deepseek-chat';
    const stream = await this.client.chat.completions.create({
      model,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.7,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield { text: delta, done: false };
    }
    yield { text: '', done: true };
  }
}
