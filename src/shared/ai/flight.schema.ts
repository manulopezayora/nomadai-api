export const flightRecommendationSchema = {
  type: 'object',
  properties: {
    flights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          airline: { type: 'string', description: 'Airline name' },
          flightNumber: { type: 'string', description: 'Flight number' },
          origin: {
            type: 'string',
            description: 'IATA airport code (e.g. JFK)',
          },
          destination: {
            type: 'string',
            description: 'IATA airport code (e.g. NRT)',
          },
          departureDate: {
            type: 'string',
            format: 'date',
            description: 'Departure date (YYYY-MM-DD)',
          },
          departureTime: {
            type: 'string',
            description: 'Departure time (HH:MM UTC)',
          },
          arrivalTime: {
            type: 'string',
            description: 'Arrival time (HH:MM local)',
          },
          price: { type: 'number', minimum: 0, description: 'Price in USD' },
          currency: { type: 'string', default: 'USD' },
          class: {
            type: 'string',
            enum: ['economy', 'premium_economy', 'business', 'first'],
            description: 'Cabin class',
          },
          stops: {
            type: 'integer',
            minimum: 0,
            description: 'Number of stops',
          },
          durationMinutes: {
            type: 'integer',
            minimum: 0,
            description: 'Total flight duration in minutes',
          },
          bookingUrl: {
            type: 'string',
            format: 'uri',
            description: 'Booking URL',
          },
        },
        required: [
          'airline',
          'origin',
          'destination',
          'departureDate',
          'price',
        ],
      },
    },
  },
  required: ['flights'],
};
