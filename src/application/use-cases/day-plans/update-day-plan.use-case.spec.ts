import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { UpdateDayPlanUseCase } from './update-day-plan.use-case';

const TRIP_ID = 'trip-123';
const DAY_PLAN_ID = 'day-123';
const USER_ID = 'user-123';

describe('UpdateDayPlanUseCase', () => {
  let useCase: UpdateDayPlanUseCase;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockDayPlanRepo = createMockDayPlanRepository();
    mockTripRepo = createMockTripRepository();
    useCase = new UpdateDayPlanUseCase(mockDayPlanRepo, mockTripRepo);
  });

  describe('validation', () => {
    it('should throw NotFoundException if trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { title: 'Updated' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trip does not belong to user', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { title: 'Updated' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if day plan does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { title: 'Updated' }, USER_ID),
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
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { title: 'Updated' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ValidationException if new day number already exists', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ dayNumber: 1, tripId: TRIP_ID }),
      );
      mockDayPlanRepo.findByTripIdAndDayNumber.mockResolvedValue(
        createMockDayPlan({ dayNumber: 2 }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { dayNumber: 2 }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if date is invalid', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { date: 'invalid' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if date is out of trip range', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findById.mockResolvedValue(
        createMockDayPlan({ tripId: TRIP_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, DAY_PLAN_ID, { date: '2026-10-01' }, USER_ID),
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
      mockDayPlanRepo.update.mockResolvedValue(
        createMockDayPlan({ title: 'Updated' }),
      );
    });

    it('should update day plan with correct data', async () => {
      await useCase.execute(
        TRIP_ID,
        DAY_PLAN_ID,
        { title: 'Updated', notes: 'New notes' },
        USER_ID,
      );

      expect(mockDayPlanRepo.update).toHaveBeenCalledWith(DAY_PLAN_ID, {
        dayNumber: undefined,
        date: undefined,
        title: 'Updated',
        notes: 'New notes',
      });
    });

    it('should return the updated day plan', async () => {
      const updated = createMockDayPlan({ title: 'Updated' });
      mockDayPlanRepo.update.mockResolvedValue(updated);

      const result = await useCase.execute(
        TRIP_ID,
        DAY_PLAN_ID,
        { title: 'Updated' },
        USER_ID,
      );

      expect(result).toEqual(updated);
    });
  });
});
