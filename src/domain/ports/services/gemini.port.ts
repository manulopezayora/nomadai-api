export abstract class GeminiPort {
  abstract generateStructuredOutput<T>(
    prompt: string,
    schema: object,
  ): Promise<T>;
}
