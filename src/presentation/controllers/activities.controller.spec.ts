import { ActivitiesController } from './activities.controller';
import { CreateActivityUseCase } from '../../application/use-cases/activities/create-activity.use-case';
import { UpdateActivityUseCase } from '../../application/use-cases/activities/update-activity.use-case';
import { DeleteActivityUseCase } from '../../application/use-cases/activities/delete-activity.use-case';
import { createMockActivity } from '../../../test/mocks/activity.factory';
import { UserRole } from '../../domain/enums/user-role.enum';
import { ActivityCategory } from '../../domain/enums/activity-category.enum';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let mockCreateActivity: jest.Mocked<CreateActivityUseCase>;
  let mockUpdateActivity: jest.Mocked<UpdateActivityUseCase>;
  let mockDeleteActivity: jest.Mocked<DeleteActivityUseCase>;

  const mockUser = {
    userId: 'user-123',
    email: 'test@test.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    mockCreateActivity = { execute: jest.fn() } as any;
    mockUpdateActivity = { execute: jest.fn() } as any;
    mockDeleteActivity = { execute: jest.fn() } as any;

    controller = new ActivitiesController(
      mockCreateActivity,
      mockUpdateActivity,
      mockDeleteActivity,
    );
  });

  describe('create', () => {
    it('should create an activity and return it', async () => {
      const activity = createMockActivity();
      mockCreateActivity.execute.mockResolvedValue(activity);

      const result = await controller.create('trip-123', 'day-123', mockUser, {
        title: 'Visit Temple',
        category: ActivityCategory.CULTURE,
      });

      expect(result).toEqual(activity);
      expect(mockCreateActivity.execute).toHaveBeenCalledWith(
        'trip-123',
        'day-123',
        { title: 'Visit Temple', category: ActivityCategory.CULTURE },
        'user-123',
      );
    });
  });

  describe('update', () => {
    it('should update an activity', async () => {
      const updated = createMockActivity({ title: 'Updated' });
      mockUpdateActivity.execute.mockResolvedValue(updated);

      const result = await controller.update(
        'trip-123',
        'day-123',
        'activity-123',
        mockUser,
        { title: 'Updated' },
      );

      expect(result).toEqual(updated);
      expect(mockUpdateActivity.execute).toHaveBeenCalledWith(
        'trip-123',
        'day-123',
        'activity-123',
        { title: 'Updated' },
        'user-123',
      );
    });
  });

  describe('remove', () => {
    it('should delete an activity and return success message', async () => {
      mockDeleteActivity.execute.mockResolvedValue(undefined);

      const result = await controller.remove(
        'trip-123',
        'day-123',
        'activity-123',
        mockUser,
      );

      expect(result).toEqual({ message: 'Activity deleted successfully' });
      expect(mockDeleteActivity.execute).toHaveBeenCalledWith(
        'trip-123',
        'day-123',
        'activity-123',
        'user-123',
      );
    });
  });
});
