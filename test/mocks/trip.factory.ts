import { Trip } from '../../src/domain/entities/trip.entity';
import { TripStatus } from '../../src/domain/enums/trip-status.enum';
import { TravelStyle } from '../../src/domain/enums/travel-style.enum';

export const createMockTrip = (overrides?: Partial<Trip>): Trip => ({
  id: 'trip-id-123',
  userId: 'user-id-123',
  title: 'Trip to Japan',
  destination: 'Tokyo',
  startDate: new Date('2026-09-15'),
  endDate: new Date('2026-09-25'),
  budget: 2000,
  travelerCount: 2,
  preferences: {
    interests: ['culture', 'food'],
    travelStyle: TravelStyle.MID,
  },
  status: TripStatus.PLANNING,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});
