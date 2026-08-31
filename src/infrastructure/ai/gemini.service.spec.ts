import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from './gemini.service';

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
      get: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new GeminiService(configService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize the SDK with API key', () => {
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
        model: 'gemini-2.5-flash',
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

    it('should throw when response is empty', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });

      await expect(
        service.generateStructuredOutput('prompt', testSchema),
      ).rejects.toThrow('Gemini returned empty response');
    });

    it('should throw on invalid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not-json' });

      await expect(
        service.generateStructuredOutput('prompt', testSchema),
      ).rejects.toThrow();
    });
  });
});
