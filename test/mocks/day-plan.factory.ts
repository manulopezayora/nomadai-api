import { DayPlan } from '../../src/domain/entities/day-plan.entity';

export const createMockDayPlan = (overrides?: Partial<DayPlan>): DayPlan => ({
  id: 'day-plan-id-123',
  tripId: 'trip-id-123',
  dayNumber: 1,
  date: new Date('2026-09-15'),
  title: 'Day 1 - Arrival',
  notes: 'Arrive at Narita Airport',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});
