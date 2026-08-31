export const hotelRecommendationSchema = {
  type: 'object',
  properties: {
    hotels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Hotel name' },
          address: { type: 'string', description: 'Full address' },
          city: { type: 'string', description: 'City name' },
          country: { type: 'string', description: 'Country name' },
          latitude: { type: 'number', description: 'Latitude coordinate' },
          longitude: { type: 'number', description: 'Longitude coordinate' },
          pricePerNight: {
            type: 'number',
            minimum: 0,
            description: 'Price per night in USD',
          },
          currency: { type: 'string', default: 'USD' },
          starRating: {
            type: 'number',
            minimum: 1,
            maximum: 5,
            description: 'Star rating',
          },
          checkIn: { type: 'string', description: 'Check-in time (HH:MM)' },
          checkOut: { type: 'string', description: 'Check-out time (HH:MM)' },
          amenities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of amenities',
          },
          bookingUrl: {
            type: 'string',
            format: 'uri',
            description: 'Booking URL',
          },
        },
        required: ['name', 'city', 'pricePerNight', 'latitude', 'longitude'],
      },
    },
  },
  required: ['hotels'],
};
