import { FlightRecommendation } from '../../../../domain/entities/flight-recommendation.entity';
import { CreateFlightRecommendationData } from '../../../../domain/ports/repositories/flight-recommendation.repository.port';

interface PrismaFlightRecommendation {
  id: string;
  tripId: string;
  airline: string;
  flightNumber: string | null;
  departure: string;
  arrival: string;
  departureDate: string | null;
  departureTime: string;
  arrivalTime: string;
  price: number | null;
  currency: string;
  class: string | null;
  stops: number | null;
  durationMinutes: number | null;
  bookingUrl: string | null;
  notes: string | null;
  isRecommended: boolean;
  createdAt: Date;
}

export class FlightRecommendationMapper {
  static toDomain(raw: PrismaFlightRecommendation): FlightRecommendation {
    return {
      id: raw.id,
      tripId: raw.tripId,
      airline: raw.airline,
      flightNumber: raw.flightNumber,
      departure: raw.departure,
      arrival: raw.arrival,
      departureDate: raw.departureDate,
      departureTime: raw.departureTime,
      arrivalTime: raw.arrivalTime,
      price: raw.price,
      currency: raw.currency,
      class: raw.class,
      stops: raw.stops,
      durationMinutes: raw.durationMinutes,
      bookingUrl: raw.bookingUrl,
      notes: raw.notes,
      isRecommended: raw.isRecommended,
      createdAt: raw.createdAt,
    };
  }

  static toPrismaCreate(tripId: string, data: CreateFlightRecommendationData) {
    return {
      tripId,
      airline: data.airline,
      flightNumber: data.flightNumber,
      departure: data.departure,
      arrival: data.arrival,
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      price: data.price,
      currency: data.currency,
      class: data.class,
      stops: data.stops,
      durationMinutes: data.durationMinutes,
      bookingUrl: data.bookingUrl,
      notes: data.notes,
      isRecommended: data.isRecommended,
    };
  }
}
