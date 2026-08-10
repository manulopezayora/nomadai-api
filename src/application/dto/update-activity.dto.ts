import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityCategory } from '../../domain/enums/activity-category.enum';

export class UpdateActivityDto {
  @ApiPropertyOptional({
    example: 'Updated title',
    description: 'Activity title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'New location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 35.7148 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 139.7967 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '10:00' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: 'https://booking.com/123' })
  @IsString()
  @IsOptional()
  bookingUrl?: string;

  @ApiPropertyOptional({
    example: 'restaurant',
    enum: ActivityCategory,
  })
  @IsIn(Object.values(ActivityCategory))
  @IsOptional()
  category?: ActivityCategory;

  @ApiPropertyOptional({ example: 'ChIJ1dtyCfKJGGARixz6lgJT3Ys' })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;
}
