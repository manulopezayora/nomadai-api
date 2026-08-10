import { DayPlansController } from './day-plans.controller';
import { CreateDayPlanUseCase } from '../../application/use-cases/day-plans/create-day-plan.use-case';
import { UpdateDayPlanUseCase } from '../../application/use-cases/day-plans/update-day-plan.use-case';
import { DeleteDayPlanUseCase } from '../../application/use-cases/day-plans/delete-day-plan.use-case';
import { createMockDayPlan } from '../../../test/mocks/day-plan.factory';
import { UserRole } from '../../domain/enums/user-role.enum';

describe('DayPlansController', () => {
  let controller: DayPlansController;
  let mockCreateDayPlan: jest.Mocked<CreateDayPlanUseCase>;
  let mockUpdateDayPlan: jest.Mocked<UpdateDayPlanUseCase>;
  let mockDeleteDayPlan: jest.Mocked<DeleteDayPlanUseCase>;

  const mockUser = {
    userId: 'user-123',
    email: 'test@test.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    mockCreateDayPlan = { execute: jest.fn() } as any;
    mockUpdateDayPlan = { execute: jest.fn() } as any;
    mockDeleteDayPlan = { execute: jest.fn() } as any;

    controller = new DayPlansController(
      mockCreateDayPlan,
      mockUpdateDayPlan,
      mockDeleteDayPlan,
    );
  });

  describe('create', () => {
    it('should create a day plan and return it', async () => {
      const dayPlan = createMockDayPlan();
      mockCreateDayPlan.execute.mockResolvedValue(dayPlan);

      const result = await controller.create('trip-123', mockUser, {
        dayNumber: 1,
        date: '2026-09-15',
        title: 'Day 1',
      });

      expect(result).toEqual(dayPlan);
      expect(mockCreateDayPlan.execute).toHaveBeenCalledWith(
        'trip-123',
        { dayNumber: 1, date: '2026-09-15', title: 'Day 1' },
        'user-123',
      );
    });
  });

  describe('update', () => {
    it('should update a day plan', async () => {
      const updated = createMockDayPlan({ title: 'Updated' });
      mockUpdateDayPlan.execute.mockResolvedValue(updated);

      const result = await controller.update('trip-123', 'day-123', mockUser, {
        title: 'Updated',
      });

      expect(result).toEqual(updated);
      expect(mockUpdateDayPlan.execute).toHaveBeenCalledWith(
        'trip-123',
        'day-123',
        { title: 'Updated' },
        'user-123',
      );
    });
  });

  describe('remove', () => {
    it('should delete a day plan and return success message', async () => {
      mockDeleteDayPlan.execute.mockResolvedValue(undefined);

      const result = await controller.remove('trip-123', 'day-123', mockUser);

      expect(result).toEqual({ message: 'Day plan deleted successfully' });
      expect(mockDeleteDayPlan.execute).toHaveBeenCalledWith(
        'trip-123',
        'day-123',
        'user-123',
      );
    });
  });
});
