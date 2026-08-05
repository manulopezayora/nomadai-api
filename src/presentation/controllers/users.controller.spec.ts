import { UsersController } from './users.controller';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UserRole } from '../../domain/enums/user-role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let mockListUsersUseCase: jest.Mocked<ListUsersUseCase>;
  let mockUpdateUserUseCase: jest.Mocked<UpdateUserUseCase>;

  beforeEach(() => {
    mockListUsersUseCase = {
      execute: jest.fn(),
    } as any;
    mockUpdateUserUseCase = {
      execute: jest.fn(),
    } as any;
    controller = new UsersController(
      mockListUsersUseCase,
      mockUpdateUserUseCase,
    );
  });

  describe('findAll', () => {
    it('should return list of users without passwords', async () => {
      const users = {
        data: [
          {
            id: '1',
            email: 'user1@test.com',
            firstName: 'User',
            role: UserRole.USER,
          },
          {
            id: '2',
            email: 'admin@test.com',
            firstName: 'Admin',
            role: UserRole.ADMIN,
          },
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockListUsersUseCase.execute.mockResolvedValue(users as any);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(users);
      expect(mockListUsersUseCase.execute).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('update', () => {
    it('should call updateUserUseCase with correct params', async () => {
      const updatedUser = {
        id: 'user-123',
        email: 'test@test.com',
        firstName: 'Updated',
        role: UserRole.USER,
      };
      mockUpdateUserUseCase.execute.mockResolvedValue(updatedUser as any);

      const result = await controller.update(
        'user-123',
        { firstName: 'Updated' },
        { userId: 'user-123', role: UserRole.USER },
      );

      expect(result).toEqual(updatedUser);
      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith(
        'user-123',
        { firstName: 'Updated' },
        { userId: 'user-123', role: UserRole.USER },
      );
    });
  });
});
