import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { createMockActivityRepository } from '../../../../test/mocks/activity-repository.mock';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockActivity } from '../../../../test/mocks/activity.factory';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { DeleteActivityUseCase } from './delete-activity.use-case';

const TRIP_ID = 'trip-123';
const DAY_PLAN_ID = 'day-123';
const ACTIVITY_ID = 'activity-123';
const USER_ID = 'user-123';

describe('DeleteActivityUseCase', () => {
  let useCase: DeleteActivityUseCase;
  let mockActivityRepo: ReturnType<typeof createMockActivityRepository>;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockActivityRepo = createMockActivityRepository();
    mockDayPlanRepo = createMockDayPlanRepository();
    mockTripRepo = createMockTripRepository();
    useCase = new DeleteActivityUseCase(
      mockActivityRepo,
      mockDayPlanRepo,
      mockTripRepo,
    );
  });

  describe('validation', () => {
    it('should throw NotFoundException if trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trip does not belong to user', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if day plan does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID),
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
        useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID),
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
        useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID),
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
        useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('successful deletion', () => {
    it('should delete the activity', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );
      mockActivityRepo.findById.mockResolvedValue(
        createMockActivity({ dayPlanId: DAY_PLAN_ID }),
      );
      mockActivityRepo.delete.mockResolvedValue(undefined);

      await useCase.execute(TRIP_ID, DAY_PLAN_ID, ACTIVITY_ID, USER_ID);

      expect(mockActivityRepo.delete).toHaveBeenCalledWith(ACTIVITY_ID);
    });
  });
});
