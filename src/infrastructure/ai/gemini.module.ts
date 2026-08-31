import { Module } from '@nestjs/common';

import { GeminiPort } from '../../domain/ports/services/gemini.port';
import { GeminiService } from './gemini.service';

@Module({
  providers: [
    {
      provide: GeminiPort,
      useClass: GeminiService,
    },
  ],
  exports: [GeminiPort],
})
export class GeminiModule {}
