import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { GeneratedTripDataDto } from './generated-trip-data.dto';

export class GenerateItineraryDto {
  @ApiProperty({
    description: 'Trip data from POST /trips/generate',
    type: GeneratedTripDataDto,
  })
  @ValidateNested()
  @Type(() => GeneratedTripDataDto)
  trip!: GeneratedTripDataDto;
}
