export const itinerarySchema = {
  type: 'object',
  properties: {
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dayNumber: {
            type: 'integer',
            minimum: 1,
            description: 'Day number in the trip',
          },
          title: { type: 'string', description: 'Short title for the day' },
          summary: { type: 'string', description: 'Brief summary of the day' },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Activity name' },
                description: {
                  type: 'string',
                  description: 'Detailed description',
                },
                category: {
                  type: 'string',
                  enum: [
                    'sightseeing',
                    'food',
                    'culture',
                    'adventure',
                    'relaxation',
                    'shopping',
                    'nightlife',
                    'transport',
                    'other',
                  ],
                  description: 'Activity category',
                },
                startTime: {
                  type: 'string',
                  description: 'Start time (HH:MM)',
                },
                endTime: { type: 'string', description: 'End time (HH:MM)' },
                locationName: { type: 'string', description: 'Location name' },
                latitude: {
                  type: 'number',
                  description: 'Latitude coordinate',
                },
                longitude: {
                  type: 'number',
                  description: 'Longitude coordinate',
                },
                costEstimate: {
                  type: 'number',
                  minimum: 0,
                  description: 'Estimated cost in USD',
                },
                tips: {
                  type: 'string',
                  description: 'Helpful tips for the activity',
                },
              },
              required: ['title', 'category', 'latitude', 'longitude'],
            },
          },
        },
        required: ['dayNumber', 'title', 'activities'],
      },
    },
  },
  required: ['days'],
};
