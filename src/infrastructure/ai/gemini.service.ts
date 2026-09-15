import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GeminiPort } from '../../domain/ports/services/gemini.port';
import { GeminiServiceException } from '../../domain/exceptions/gemini-service.exception';

@Injectable()
export class GeminiService extends GeminiPort implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private ai!: GoogleGenAI;
  private model!: string;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    super();
  }

  onModuleInit(): void {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-3.6-flash');
    this.ai = new GoogleGenAI({ apiKey });
    this.logger.log(`GeminiService initialized with model: ${this.model}`);
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: object,
  ): Promise<T> {
    this.logger.debug(`Generating structured output with model ${this.model}`);

    try {
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
        throw new GeminiServiceException(
          'GEMINI_EMPTY_RESPONSE',
          'Gemini returned empty response',
        );
      }

      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof GeminiServiceException) {
        throw error;
      }

      const err = error as {
        status?: string | number;
        code?: string | number;
        message?: string;
        stack?: string;
      };

      const status = err.status ?? err.code;
      const message = err.message ?? String(error);

      this.logger.error(`Gemini API error: ${message}`, err.stack);

      switch (status) {
        case 'NOT_FOUND':
        case 404:
          throw new GeminiServiceException(
            'GEMINI_MODEL_NOT_FOUND',
            `Model "${this.model}" not found or deprecated. Update GEMINI_MODEL env var.`,
          );
        case 'INVALID_ARGUMENT':
        case 400:
          throw new GeminiServiceException(
            'GEMINI_INVALID_REQUEST',
            `Invalid request to Gemini: ${message}`,
          );
        case 'RESOURCE_EXHAUSTED':
        case 429:
          throw new GeminiServiceException(
            'GEMINI_RATE_LIMITED',
            'Gemini API rate limit exceeded. Try again later.',
          );
        case 'UNAUTHENTICATED':
        case 401:
          throw new GeminiServiceException(
            'GEMINI_AUTH_ERROR',
            'Invalid Gemini API key. Check GEMINI_API_KEY env var.',
          );
        default:
          throw new GeminiServiceException(
            'GEMINI_INTERNAL_ERROR',
            `Gemini error: ${message}`,
          );
      }
    }
  }
}
