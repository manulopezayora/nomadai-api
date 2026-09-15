import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from './gemini.service';
import { GeminiServiceException } from '../../domain/exceptions/gemini-service.exception';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('GeminiService', () => {
  let service: GeminiService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GEMINI_MODEL') return 'gemini-3.6-flash';
        return 'test-api-key';
      }),
      getOrThrow: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new GeminiService(configService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize the SDK with API key and model from config', () => {
      service.onModuleInit();

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should default to gemini-3.6-flash when GEMINI_MODEL is not set', () => {
      configService.get.mockReturnValue(undefined);

      service.onModuleInit();

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });

  describe('generateStructuredOutput', () => {
    const testSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };

    beforeEach(() => {
      service.onModuleInit();
    });

    it('should call generateContent with correct parameters', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ name: 'Test' }),
      });

      await service.generateStructuredOutput('Test prompt', testSchema);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-3.6-flash',
        contents: 'Test prompt',
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: testSchema,
          temperature: 0.7,
        },
      });
    });

    it('should return parsed JSON response', async () => {
      const expected = { name: 'Test' };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(expected),
      });

      const result = await service.generateStructuredOutput(
        'prompt',
        testSchema,
      );

      expect(result).toEqual(expected);
    });

    it('should throw GeminiServiceException when response is empty', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });

      await expect(
        service.generateStructuredOutput('prompt', testSchema),
      ).rejects.toThrow(GeminiServiceException);
    });

    it('should throw on invalid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not-json' });

      await expect(
        service.generateStructuredOutput('prompt', testSchema),
      ).rejects.toThrow();
    });

    it('should map 404 to GEMINI_MODEL_NOT_FOUND', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 'NOT_FOUND',
        message: 'Model not found',
      });

      try {
        await service.generateStructuredOutput('prompt', testSchema);
        fail('Expected GeminiServiceException');
      } catch (error) {
        expect(error).toBeInstanceOf(GeminiServiceException);
        expect((error as GeminiServiceException).code).toBe(
          'GEMINI_MODEL_NOT_FOUND',
        );
        expect((error as GeminiServiceException).statusCode).toBe(502);
      }
    });

    it('should map 429 to GEMINI_RATE_LIMITED', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 'RESOURCE_EXHAUSTED',
        message: 'Rate limit exceeded',
      });

      try {
        await service.generateStructuredOutput('prompt', testSchema);
        fail('Expected GeminiServiceException');
      } catch (error) {
        expect(error).toBeInstanceOf(GeminiServiceException);
        expect((error as GeminiServiceException).code).toBe(
          'GEMINI_RATE_LIMITED',
        );
      }
    });

    it('should map 401 to GEMINI_AUTH_ERROR', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 'UNAUTHENTICATED',
        message: 'Invalid API key',
      });

      try {
        await service.generateStructuredOutput('prompt', testSchema);
        fail('Expected GeminiServiceException');
      } catch (error) {
        expect(error).toBeInstanceOf(GeminiServiceException);
        expect((error as GeminiServiceException).code).toBe(
          'GEMINI_AUTH_ERROR',
        );
      }
    });
  });
});
