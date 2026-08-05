import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TravelStyle } from '../../domain/enums/travel-style.enum';

export class CreateTripDto {
  @ApiProperty({ example: 'Trip to Japan', description: 'Trip title' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Tokyo', description: 'Destination city or country' })
  @IsString()
  destination!: string;

  @ApiProperty({ example: '2026-09-15', description: 'Start date (ISO 8601)' })
  @IsString()
  startDate!: string;

  @ApiProperty({ example: '2026-09-25', description: 'End date (ISO 8601)' })
  @IsString()
  endDate!: string;

  @ApiPropertyOptional({ example: 2000, description: 'Budget in EUR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of travelers',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  travelerCount?: number;

  @ApiProperty({
    example: ['culture', 'food'],
    description: 'List of interests',
  })
  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @ApiPropertyOptional({
    example: 'mid',
    description: 'Travel style',
    enum: TravelStyle,
    default: TravelStyle.MID,
  })
  @IsIn(Object.values(TravelStyle))
  @IsOptional()
  travelStyle?: TravelStyle;
}
