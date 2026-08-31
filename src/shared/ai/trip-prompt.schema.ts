export const tripPromptSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'A short catchy title for the trip',
    },
    destination: {
      type: 'string',
      description: 'Main destination city or country',
    },
    startDate: {
      type: 'string',
      format: 'date',
      description: 'Start date in YYYY-MM-DD format',
    },
    endDate: {
      type: 'string',
      format: 'date',
      description: 'End date in YYYY-MM-DD format',
    },
    travelerCount: {
      type: 'integer',
      minimum: 1,
      description: 'Number of travelers',
    },
    interests: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of travel interests (e.g. culture, food, adventure)',
    },
    travelStyle: {
      type: 'string',
      enum: ['budget', 'mid', 'luxury'],
      description: 'Travel style preference',
    },
    budget: {
      type: 'number',
      minimum: 0,
      description: 'Total budget in EUR if mentioned, otherwise null',
    },
  },
  required: ['title', 'destination', 'startDate', 'endDate', 'interests'],
};
