import { TravelStyle } from '../../domain/enums/travel-style.enum';

export interface GeminiTripPromptResponse {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount?: number;
  interests: string[];
  travelStyle?: string;
  budget?: number;
}

export interface MappedTripData {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelerCount: number;
  interests: string[];
  travelStyle: TravelStyle;
  budget: number | null;
}

export class TripPromptMapper {
  static toCreateData(response: GeminiTripPromptResponse): MappedTripData {
    return {
      title: response.title,
      destination: response.destination,
      startDate: new Date(response.startDate),
      endDate: new Date(response.endDate),
      travelerCount: response.travelerCount ?? 1,
      interests: response.interests,
      travelStyle: TripPromptMapper.mapTravelStyle(response.travelStyle),
      budget: response.budget ?? null,
    };
  }

  private static mapTravelStyle(style?: string): TravelStyle {
    const normalized = style?.toLowerCase().trim();
    const values = Object.values(TravelStyle) as string[];
    if (normalized && values.includes(normalized)) {
      return normalized as TravelStyle;
    }
    return TravelStyle.MID;
  }
}
