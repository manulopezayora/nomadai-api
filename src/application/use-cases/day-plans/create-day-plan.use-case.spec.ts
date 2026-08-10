import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockDayPlanRepository } from '../../../../test/mocks/day-plan-repository.mock';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockDayPlan } from '../../../../test/mocks/day-plan.factory';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { CreateDayPlanUseCase } from './create-day-plan.use-case';

const TRIP_ID = 'trip-123';
const USER_ID = 'user-123';

describe('CreateDayPlanUseCase', () => {
  let useCase: CreateDayPlanUseCase;
  let mockDayPlanRepo: ReturnType<typeof createMockDayPlanRepository>;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockDayPlanRepo = createMockDayPlanRepository();
    mockTripRepo = createMockTripRepository();
    useCase = new CreateDayPlanUseCase(mockDayPlanRepo, mockTripRepo);
  });

  describe('validation', () => {
    it('should throw NotFoundException if trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: '2026-09-15' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trip does not belong to user', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: '2026-09-15' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ValidationException if date is missing', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: '' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if date is invalid', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: 'not-a-date' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if date is before trip start', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: '2026-09-01' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if date is after trip end', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: '2026-10-01' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if day number already exists', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findByTripIdAndDayNumber.mockResolvedValue(
        createMockDayPlan(),
      );

      await expect(
        useCase.execute(TRIP_ID, { dayNumber: 1, date: '2026-09-15' }, USER_ID),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('successful creation', () => {
    beforeEach(() => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: USER_ID }),
      );
      mockDayPlanRepo.findByTripIdAndDayNumber.mockResolvedValue(null);
      mockDayPlanRepo.create.mockResolvedValue(createMockDayPlan());
    });

    it('should create day plan with correct data', async () => {
      await useCase.execute(
        TRIP_ID,
        { dayNumber: 1, date: '2026-09-15', title: 'Day 1' },
        USER_ID,
      );

      expect(mockDayPlanRepo.create).toHaveBeenCalledWith({
        tripId: TRIP_ID,
        dayNumber: 1,
        date: new Date('2026-09-15'),
        title: 'Day 1',
        notes: null,
      });
    });

    it('should return the created day plan', async () => {
      const dayPlan = createMockDayPlan({ dayNumber: 3 });
      mockDayPlanRepo.create.mockResolvedValue(dayPlan);

      const result = await useCase.execute(
        TRIP_ID,
        { dayNumber: 3, date: '2026-09-17' },
        USER_ID,
      );

      expect(result).toEqual(dayPlan);
    });
  });
});
