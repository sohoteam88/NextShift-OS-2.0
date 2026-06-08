import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIGenerateParams, AIGenerateResult, AIStreamChunk } from './types';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateText(params: AIGenerateParams): Promise<AIGenerateResult> {
    const start = Date.now();
    const response = await this.client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.7,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    });

    const text = (response.content as Array<{ type: string; text?: string }>)
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      text,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      model: ANTHROPIC_MODEL,
      provider: 'anthropic',
      durationMs: Date.now() - start,
    };
  }

  async *generateStream(params: AIGenerateParams): AsyncGenerator<AIStreamChunk> {
    const stream = this.client.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.7,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    });

    for await (const event of stream as AsyncIterable<{
      type: string;
      delta?: { type?: string; text?: string };
    }>) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        yield { text: event.delta.text ?? '', done: false };
      }
    }

    yield { text: '', done: true };
  }
}
