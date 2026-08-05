import { TripMapper } from './trip.mapper';

describe('TripMapper', () => {
  const rawTrip = {
    id: 'trip-123',
    userId: 'user-456',
    title: 'Trip to Japan',
    destination: 'Tokyo',
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-09-25'),
    budget: 2000,
    travelerCount: 2,
    preferences: { interests: ['culture', 'food'], travelStyle: 'mid' },
    status: 'planning',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('toDomain', () => {
    it('should map raw trip to domain entity', () => {
      const result = TripMapper.toDomain(rawTrip);

      expect(result.id).toBe('trip-123');
      expect(result.userId).toBe('user-456');
      expect(result.title).toBe('Trip to Japan');
      expect(result.destination).toBe('Tokyo');
      expect(result.preferences.interests).toEqual(['culture', 'food']);
      expect(result.preferences.travelStyle).toBe('mid');
    });

    it('should handle missing preferences gracefully', () => {
      const raw = { ...rawTrip, preferences: {} };
      const result = TripMapper.toDomain(raw);

      expect(result.preferences.interests).toEqual([]);
      expect(result.preferences.travelStyle).toBe('mid');
    });

    it('should handle null budget', () => {
      const raw = { ...rawTrip, budget: null };
      const result = TripMapper.toDomain(raw);

      expect(result.budget).toBeNull();
    });
  });

  describe('toPrismaCreate', () => {
    it('should map create data to Prisma format', () => {
      const result = TripMapper.toPrismaCreate({
        userId: 'user-1',
        title: 'Paris Trip',
        destination: 'Paris',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-10'),
        budget: 1500,
        travelerCount: 2,
        preferences: { interests: ['art'], travelStyle: 'luxury' },
      });

      expect(result.userId).toBe('user-1');
      expect(result.title).toBe('Paris Trip');
      expect(result.status).toBe('planning');
      expect(result.preferences).toEqual({
        interests: ['art'],
        travelStyle: 'luxury',
      });
    });
  });

  describe('toPrismaUpdate', () => {
    it('should map update data to Prisma format', () => {
      const result = TripMapper.toPrismaUpdate({
        title: 'New Title',
        status: 'active',
      });

      expect(result).toEqual({ title: 'New Title', status: 'active' });
    });

    it('should not include undefined fields', () => {
      const result = TripMapper.toPrismaUpdate({ title: 'Test' });

      expect(result).not.toHaveProperty('destination');
      expect(result).not.toHaveProperty('budget');
    });
  });
});
