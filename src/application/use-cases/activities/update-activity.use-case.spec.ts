import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockActivityRepository } from '../../../../test/mocks/activity-repository.mock';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockActivity } from '../../../../test/mocks/activity.factory';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { UpdateActivityUseCase } from './update-activity.use-case';

const TRIP_ID = 'trip-123';
const DAY_PLAN_ID = 'day-123';
const ACTIVITY_ID = 'activity-123';
const USER_ID = 'user-123';

describe('UpdateActivityUseCase', () => {
  let useCase: UpdateActivityUseCase;
  let mockActivityRepo: ReturnType<typeof createMockActivityRepository>;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockActivityRepo = createMockActivityRepository();
    mockDayPlanRepo = createMockDayPlanRepository();
    mockTripRepo = createMockTripRepository();
    useCase = new UpdateActivityUseCase(
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
          ACTIVITY_ID,
          { title: 'Updated' },
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
          ACTIVITY_ID,
          { title: 'Updated' },
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
          ACTIVITY_ID,
          { title: 'Updated' },
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
          ACTIVITY_ID,
          { title: 'Updated' },
          USER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if activity does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );
      mockActivityRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          ACTIVITY_ID,
          { title: 'Updated' },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if activity does not belong to day plan', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );
      mockActivityRepo.findById.mockResolvedValue(
        createMockActivity({ dayPlanId: 'other-day' }),
      );

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          ACTIVITY_ID,
          { title: 'Updated' },
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
      mockActivityRepo.findById.mockResolvedValue(
        createMockActivity({ dayPlanId: DAY_PLAN_ID }),
      );

      await expect(
        useCase.execute(
          TRIP_ID,
          DAY_PLAN_ID,
          ACTIVITY_ID,
          { title: '   ' },
          USER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('successful update', () => {
    beforeEach(() => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );
      mockActivityRepo.findById.mockResolvedValue(
        createMockActivity({ dayPlanId: DAY_PLAN_ID }),
      );
      mockActivityRepo.update.mockResolvedValue(
        createMockActivity({ dayPlanId: DAY_PLAN_ID, title: 'Updated' }),
      );
    });

    it('should update activity with correct data', async () => {
      await useCase.execute(
        TRIP_ID,
        DAY_PLAN_ID,
        ACTIVITY_ID,
        { title: 'Updated', cost: 15 },
        USER_ID,
      );

      expect(mockActivityRepo.update).toHaveBeenCalledWith(ACTIVITY_ID, {
        title: 'Updated',
        description: undefined,
        location: undefined,
        latitude: undefined,
        longitude: undefined,
        startTime: undefined,
        endTime: undefined,
        cost: 15,
        bookingUrl: undefined,
        category: undefined,
        placeId: undefined,
        order: undefined,
      });
    });

    it('should return the updated activity', async () => {
      const updated = createMockActivity({
        dayPlanId: DAY_PLAN_ID,
        title: 'Updated',
      });
      mockActivityRepo.update.mockResolvedValue(updated);

      const result = await useCase.execute(
        TRIP_ID,
        DAY_PLAN_ID,
        ACTIVITY_ID,
        { title: 'Updated' },
        USER_ID,
      );

      expect(result).toEqual(updated);
    });
  });
});
