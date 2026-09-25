import { ApiProperty } from '@nestjs/swagger';
import { TravelStyle } from '../../domain/enums/travel-style.enum';

export interface GenerateTripData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelStyle: TravelStyle;
  travelerCount: number;
  budget: number | null;
}

export class GenerateItineraryDto {
  @ApiProperty({
    description: 'Trip data from POST /trips/generate',
    example: {
      title: '5 Days in Rome',
      destination: 'Rome',
      startDate: '2026-10-01',
      endDate: '2026-10-06',
      interests: ['culture', 'food'],
      travelStyle: 'mid',
      travelerCount: 1,
      budget: null,
    },
  })
  trip!: GenerateTripData;
}
