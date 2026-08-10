import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityCategory } from '../../domain/enums/activity-category.enum';

export class CreateActivityDto {
  @ApiProperty({
    example: 'Visit Senso-ji Temple',
    description: 'Activity title',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Oldest temple in Tokyo',
    description: 'Activity description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Senso-ji, Asakusa',
    description: 'Location name',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 35.7148, description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 139.7967, description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '09:00', description: 'Start time (HH:mm)' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'End time (HH:mm)' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 0, description: 'Estimated cost in EUR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({
    example: 'https://www.klook.com/activity/123',
    description: 'Booking URL',
  })
  @IsString()
  @IsOptional()
  bookingUrl?: string;

  @ApiPropertyOptional({
    example: 'temple',
    description: 'Activity category',
    enum: ActivityCategory,
  })
  @IsIn(Object.values(ActivityCategory))
  @IsOptional()
  category?: ActivityCategory;

  @ApiPropertyOptional({
    example: 'ChIJ1dtyCfKJGGARixz6lgJT3Ys',
    description: 'Google Places ID',
  })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Order within the day (auto-assigned if omitted)',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;
}
