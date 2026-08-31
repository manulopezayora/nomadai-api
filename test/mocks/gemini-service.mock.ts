import { GeminiPort } from '../../src/domain/ports/services/gemini.port';

export const createMockGeminiService = (): jest.Mocked<GeminiPort> => ({
  generateStructuredOutput: jest.fn().mockResolvedValue({}),
});
