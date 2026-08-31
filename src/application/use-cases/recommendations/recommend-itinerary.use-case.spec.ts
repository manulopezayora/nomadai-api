import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockActivityRepository } from '../../../../test/mocks/activity-repository.mock';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { RecommendItineraryUseCase } from './recommend-itinerary.use-case';

const OWNER_ID = 'user-id-123';

describe('RecommendItineraryUseCase', () => {
  let useCase: RecommendItineraryUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockActivityRepo: ReturnType<typeof createMockActivityRepository>;
  let mockGemini: ReturnType<typeof createMockGeminiService>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    mockDayPlanRepo = createMockDayPlanRepository();
    mockActivityRepo = createMockActivityRepository();
    mockGemini = createMockGeminiService();
    useCase = new RecommendItineraryUseCase(
      mockTripRepo,
      mockDayPlanRepo,
      mockActivityRepo,
      mockGemini,
    );
    jest.clearAllMocks();
  });

  describe('validation', () => {
    it('should throw NotFoundException when trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('trip-123', OWNER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not trip owner', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(useCase.execute('trip-123', OWNER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('successful generation', () => {
    const mockItineraryResponse = {
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Tokyo',
          summary: 'Explore Shibuya',
          activities: [
            {
              title: 'Visit Senso-ji Temple',
              description: 'Oldest temple in Tokyo',
              category: 'other',
              startTime: '10:00',
              endTime: '12:00',
              locationName: 'Senso-ji Temple',
              latitude: 35.7148,
              longitude: 139.7967,
              costEstimate: 0,
              tips: 'Free entry',
            },
          ],
        },
      ],
    };

    beforeEach(() => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());
      mockGemini.generateStructuredOutput.mockResolvedValue(
        mockItineraryResponse,
      );
      mockDayPlanRepo.findByTripIdAndDayNumber.mockResolvedValue(null);
      mockDayPlanRepo.create.mockResolvedValue(
        createMockDayPlan({ dayNumber: 1 }),
      );
      mockActivityRepo.create.mockResolvedValue({
        id: 'activity-1',
        dayPlanId: 'day-plan-1',
        title: 'Visit Senso-ji Temple',
        description: 'Oldest temple in Tokyo\nTips: Free entry',
        location: 'Senso-ji Temple',
        latitude: 35.7148,
        longitude: 139.7967,
        startTime: '10:00',
        endTime: '12:00',
        cost: 0,
        bookingUrl: null,
        category: 'culture',
        placeId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should call Gemini with correct prompt and schema', async () => {
      await useCase.execute('trip-123', OWNER_ID);

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Tokyo'),
        expect.objectContaining({ type: 'object' }),
      );
    });

    it('should create day plans', async () => {
      await useCase.execute('trip-123', OWNER_ID);

      expect(mockDayPlanRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 'trip-123',
          dayNumber: 1,
          title: 'Arrival in Tokyo',
        }),
      );
    });

    it('should create activities for each day plan', async () => {
      await useCase.execute('trip-123', OWNER_ID);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Visit Senso-ji Temple',
          category: 'other',
          latitude: 35.7148,
          longitude: 139.7967,
        }),
      );
    });

    it('should return day plans and activities', async () => {
      const result = await useCase.execute('trip-123', OWNER_ID);

      expect(result.dayPlans).toHaveLength(1);
      expect(result.activities).toHaveLength(1);
    });

    it('should update existing day plans instead of creating duplicates', async () => {
      const existingDayPlan = createMockDayPlan({ dayNumber: 1 });
      mockDayPlanRepo.findByTripIdAndDayNumber.mockResolvedValue(
        existingDayPlan,
      );

      await useCase.execute('trip-123', OWNER_ID);

      expect(mockDayPlanRepo.update).toHaveBeenCalledWith(existingDayPlan.id, {
        title: 'Arrival in Tokyo',
        notes: 'Explore Shibuya',
      });
      expect(mockDayPlanRepo.create).not.toHaveBeenCalled();
    });
  });
});
