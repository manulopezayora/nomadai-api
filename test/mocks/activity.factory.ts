import { Activity } from '../../src/domain/entities/activity.entity';
import { ActivityCategory } from '../../src/domain/enums/activity-category.enum';

export const createMockActivity = (
  overrides?: Partial<Activity>,
): Activity => ({
  id: 'activity-id-123',
  dayPlanId: 'day-plan-id-123',
  title: 'Visit Senso-ji Temple',
  description: 'Oldest temple in Tokyo',
  location: 'Senso-ji, Asakusa',
  latitude: 35.7148,
  longitude: 139.7967,
  startTime: '09:00',
  endTime: '12:00',
  cost: 0,
  bookingUrl: null,
  category: ActivityCategory.CULTURE,
  placeId: 'ChIJ1dtyCfKJGGARixz6lgJT3Ys',
  order: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});
