import { CreateFlightRecommendationData } from '../../domain/ports/repositories/flight-recommendation.repository.port';

interface GeminiFlight {
  airline: string;
  flightNumber?: string;
  origin: string;
  destination: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  price: number;
  currency?: string;
  class?: string;
  stops?: number;
  durationMinutes?: number;
  bookingUrl?: string;
}

export interface GeminiFlightResponse {
  flights: GeminiFlight[];
}

export class FlightRecommendationMapper {
  static toCreateDataArray(
    response: unknown,
  ): CreateFlightRecommendationData[] {
    const data = response as GeminiFlightResponse;
    return data.flights.map((flight) => ({
      airline: flight.airline,
      flightNumber: flight.flightNumber ?? null,
      departure: flight.origin,
      arrival: flight.destination,
      departureDate: flight.departureDate ?? null,
      departureTime: flight.departureTime ?? '',
      arrivalTime: flight.arrivalTime ?? '',
      price: flight.price ?? null,
      currency: flight.currency ?? 'EUR',
      class: flight.class ?? null,
      stops: flight.stops ?? null,
      durationMinutes: flight.durationMinutes ?? null,
      bookingUrl: flight.bookingUrl ?? null,
      notes: null,
      isRecommended: true,
    }));
  }
}
