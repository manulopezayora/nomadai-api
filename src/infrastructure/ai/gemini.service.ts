import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GeminiPort } from '../../domain/ports/services/gemini.port';

@Injectable()
export class GeminiService extends GeminiPort implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private ai!: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  onModuleInit(): void {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
    this.logger.log('GeminiService initialized');
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: object,
  ): Promise<T> {
    this.logger.debug(`Generating structured output with model ${this.model}`);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }

    return JSON.parse(text) as T;
  }
}
