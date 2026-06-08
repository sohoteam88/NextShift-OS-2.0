import OpenAI from 'openai';
import type { AIProvider, AIGenerateParams, AIGenerateResult, AIStreamChunk } from './types';

const OPENAI_MODEL = 'gpt-4o';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateText(params: AIGenerateParams): Promise<AIGenerateResult> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: OPENAI_MODEL,
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
      model: OPENAI_MODEL,
      provider: 'openai',
      durationMs: Date.now() - start,
    };
  }

  async *generateStream(params: AIGenerateParams): AsyncGenerator<AIStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: OPENAI_MODEL,
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
      if (delta) {
        yield { text: delta, done: false };
      }
    }

    yield { text: '', done: true };
  }
}
