import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTripDto {
  @ApiProperty({
    example: '10 days in Japan, culture and relax',
    description: 'Natural language description of the trip',
  })
  @IsString()
  @MinLength(10)
  prompt!: string;
}
