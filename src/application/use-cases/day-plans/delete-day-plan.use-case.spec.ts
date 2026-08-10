import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { DeleteDayPlanUseCase } from './delete-day-plan.use-case';

const TRIP_ID = 'trip-123';
const DAY_PLAN_ID = 'day-123';
const USER_ID = 'user-123';

describe('DeleteDayPlanUseCase', () => {
  let useCase: DeleteDayPlanUseCase;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockDayPlanRepo = createMockDayPlanRepository();
    mockTripRepo = createMockTripRepository();
    useCase = new DeleteDayPlanUseCase(mockDayPlanRepo, mockTripRepo);
  });

  describe('validation', () => {
    it('should throw NotFoundException if trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trip does not belong to user', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if day plan does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, USER_ID),
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
        useCase.execute(TRIP_ID, DAY_PLAN_ID, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('successful deletion', () => {
    it('should delete the day plan', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );
      mockDayPlanRepo.delete.mockResolvedValue(undefined);

      await useCase.execute(TRIP_ID, DAY_PLAN_ID, USER_ID);

      expect(mockDayPlanRepo.delete).toHaveBeenCalledWith(DAY_PLAN_ID);
    });
  });
});
