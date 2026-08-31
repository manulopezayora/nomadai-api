import { CreateFlightRecommendationData } from '../../../../domain/ports/repositories/flight-recommendation.repository.port';

interface GeminiFlight {
  airline: string;
  origin: string;
  destination: string;
  departureTime?: string;
  arrivalTime?: string;
  price: number;
  currency?: string;
  bookingUrl?: string;
  flightNumber?: string;
  class?: string;
  stops?: number;
  durationMinutes?: number;
}

interface GeminiFlightResponse {
  flights: GeminiFlight[];
}

export class FlightRecommendationMapper {
  static toCreateDataArray(
    response: GeminiFlightResponse,
  ): CreateFlightRecommendationData[] {
    return response.flights.map((flight) => ({
      airline: flight.airline,
      departure: flight.origin,
      arrival: flight.destination,
      departureTime: flight.departureTime ?? '',
      arrivalTime: flight.arrivalTime ?? '',
      price: flight.price ?? null,
      currency: flight.currency ?? 'EUR',
      bookingUrl: flight.bookingUrl ?? null,
      notes:
        [
          flight.flightNumber ? `Flight: ${flight.flightNumber}` : null,
          flight.class ? `Class: ${flight.class}` : null,
          flight.stops !== undefined
            ? `${flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}`
            : null,
          flight.durationMinutes
            ? `Duration: ${Math.floor(flight.durationMinutes / 60)}h ${flight.durationMinutes % 60}m`
            : null,
        ]
          .filter(Boolean)
          .join(' | ') || null,
      isRecommended: true,
    }));
  }
}
