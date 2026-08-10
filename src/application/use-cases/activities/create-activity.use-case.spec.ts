import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockActivityRepository } from '../../../../test/mocks/activity-repository.mock';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockActivity } from '../../../../test/mocks/activity.factory';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { CreateActivityUseCase } from './create-activity.use-case';
import { ActivityCategory } from '../../../domain/enums/activity-category.enum';

const TRIP_ID = 'trip-123';
const DAY_PLAN_ID = 'day-123';
const USER_ID = 'user-123';

describe('CreateActivityUseCase', () => {
  let useCase: CreateActivityUseCase;
  let mockActivityRepo: ReturnType<typeof createMockActivityRepository>;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockActivityRepo = createMockActivityRepository();
    mockDayPlanRepo = createMockDayPlanRepository();
    mockTripRepo = createMockTripRepository();
    useCase = new CreateActivityUseCase(
      mockActivityRepo,
      mockDayPlanRepo,
      mockTripRepo,
    );
  });

  describe('validation', () => {
    it('should throw NotFoundException if trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          { title: 'Visit Temple' },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trip does not belong to user', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          { title: 'Visit Temple' },
          USER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if day plan does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          { title: 'Visit Temple' },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if day plan does not belong to trip', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: 'other-trip' }),
      );

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          { title: 'Visit Temple' },
          USER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ValidationException for empty title', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { title: '' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('successful creation', () => {
    beforeEach(() => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );
      mockActivityRepo.create.mockResolvedValue(
        createMockActivity({ dayPlanId: DAY_PLAN_ID }),
      );
    });

    it('should create activity with correct data', async () => {
      await useCase.execute(
        TRIP_ID,
        DAY_PLAN_ID,
        {
          title: 'Visit Senso-ji',
          description: 'Oldest temple',
          category: ActivityCategory.TEMPLE,
          startTime: '09:00',
          endTime: '12:00',
        },
        USER_ID,
      );

      expect(mockActivityRepo.create).toHaveBeenCalledWith({
        dayPlanId: DAY_PLAN_ID,
        title: 'Visit Senso-ji',
        description: 'Oldest temple',
        location: undefined,
        latitude: undefined,
        longitude: undefined,
        startTime: '09:00',
        endTime: '12:00',
        cost: undefined,
        bookingUrl: undefined,
        category: ActivityCategory.TEMPLE,
        placeId: undefined,
        order: undefined,
      });
    });

    it('should return the created activity', async () => {
      const activity = createMockActivity({
        dayPlanId: DAY_PLAN_ID,
        title: 'Museum Visit',
      });
      mockActivityRepo.create.mockResolvedValue(activity);

      const result = await useCase.execute(
        TRIP_ID,
        DAY_PLAN_ID,
        { title: 'Museum Visit' },
        USER_ID,
      );

      expect(result).toEqual(activity);
    });
  });
});
