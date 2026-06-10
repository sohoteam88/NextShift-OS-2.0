import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, AIGenerateParams, AIGenerateResult, AIStreamChunk } from './types';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  }

  async generateText(params: AIGenerateParams): Promise<AIGenerateResult> {
    const modelName = params.model ?? 'gemini-2.5-flash';
    const start = Date.now();
    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: params.systemPrompt,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens ?? 1024,
      },
    });

    const result = await model.generateContent(params.userMessage);
    const response = result.response;
    const usage = response.usageMetadata;

    return {
      text: response.text(),
      tokensIn: usage?.promptTokenCount ?? 0,
      tokensOut: usage?.candidatesTokenCount ?? 0,
      model: modelName,
      provider: 'gemini',
      durationMs: Date.now() - start,
    };
  }

  async *generateStream(params: AIGenerateParams): AsyncGenerator<AIStreamChunk> {
    const modelName = params.model ?? 'gemini-2.5-flash';
    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: params.systemPrompt,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens ?? 1024,
      },
    });

    const result = await model.generateContentStream(params.userMessage);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield { text, done: false };
    }
    yield { text: '', done: true };
  }
}
