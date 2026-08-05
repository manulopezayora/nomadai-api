import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { UpdateTripUseCase } from './update-trip.use-case';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';
import { UserRole } from '../../../domain/enums/user-role.enum';

describe('UpdateTripUseCase', () => {
  let useCase: UpdateTripUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  const user = { userId: 'user-1', role: UserRole.USER };
  const admin = { userId: 'admin-1', role: UserRole.ADMIN };

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new UpdateTripUseCase(mockTripRepo);
  });

  it('should throw TripNotFoundException when trip not found', async () => {
    mockTripRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('trip-999', { title: 'New' }, user),
    ).rejects.toThrow(TripNotFoundException);
  });

  it('should throw TripNotFoundException when user does not own trip', async () => {
    const trip = createMockTrip({ userId: 'user-2' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(
      useCase.execute('trip-1', { title: 'New' }, user),
    ).rejects.toThrow(TripNotFoundException);
  });

  it('should update title successfully', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.update.mockResolvedValue({
      ...trip,
      title: 'Updated Title',
    });

    const result = await useCase.execute(
      'trip-1',
      { title: 'Updated Title' },
      user,
    );

    expect(result.title).toBe('Updated Title');
    expect(mockTripRepo.update).toHaveBeenCalledWith('trip-1', {
      title: 'Updated Title',
    });
  });

  it('should throw ValidationException for empty title', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(
      useCase.execute('trip-1', { title: '  ' }, user),
    ).rejects.toThrow(ValidationException);
  });

  it('should update preferences with new interests', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.update.mockResolvedValue(trip);

    await useCase.execute(
      'trip-1',
      { interests: ['nightlife', 'shopping'] },
      user,
    );

    expect(mockTripRepo.update).toHaveBeenCalledWith('trip-1', {
      preferences: {
        interests: ['nightlife', 'shopping'],
        travelStyle: 'mid',
      },
    });
  });

  it('should update only travelStyle when interests not provided', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.update.mockResolvedValue(trip);

    await useCase.execute('trip-1', { travelStyle: 'luxury' }, user);

    expect(mockTripRepo.update).toHaveBeenCalledWith('trip-1', {
      preferences: {
        interests: ['culture', 'food'],
        travelStyle: 'luxury',
      },
    });
  });

  it('should throw ValidationException for empty interests', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(
      useCase.execute('trip-1', { interests: [] }, user),
    ).rejects.toThrow(ValidationException);
  });

  describe('status transitions', () => {
    it('should allow planning → active', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'planning' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, status: 'active' });

      const result = await useCase.execute(
        'trip-1',
        { status: 'active' },
        user,
      );

      expect(result.status).toBe('active');
    });

    it('should allow active → completed', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, status: 'completed' });

      const result = await useCase.execute(
        'trip-1',
        { status: 'completed' },
        user,
      );

      expect(result.status).toBe('completed');
    });

    it('should allow planning → completed', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'planning' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, status: 'completed' });

      const result = await useCase.execute(
        'trip-1',
        { status: 'completed' },
        user,
      );

      expect(result.status).toBe('completed');
    });

    it('should reject completed → planning', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'completed' });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { status: 'planning' }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should reject active → planning', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { status: 'planning' }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should reject completed → active', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'completed' });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { status: 'active' }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should allow admin to change any status transition', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'completed' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, status: 'planning' });

      const result = await useCase.execute(
        'trip-1',
        { status: 'planning' },
        admin,
      );

      expect(result.status).toBe('planning');
    });

    it('should allow admin to change active → planning', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, status: 'planning' });

      const result = await useCase.execute(
        'trip-1',
        { status: 'planning' },
        admin,
      );

      expect(result.status).toBe('planning');
    });
  });

  describe('field restrictions by status', () => {
    it('should allow all fields on planning trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'planning' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue(trip);

      await expect(
        useCase.execute(
          'trip-1',
          {
            destination: 'Osaka',
            startDate: '2026-09-01',
            endDate: '2026-09-10',
          },
          user,
        ),
      ).resolves.toBeDefined();
    });

    it('should reject destination change on active trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { destination: 'Osaka' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject startDate change on active trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { startDate: '2026-10-01' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow title change on active trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, title: 'Updated' });

      await expect(
        useCase.execute('trip-1', { title: 'Updated' }, user),
      ).resolves.toBeDefined();
    });

    it('should reject all fields on completed trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'completed' });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { title: 'Updated' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to edit any field on active trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'active' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, destination: 'Osaka' });

      await expect(
        useCase.execute('trip-1', { destination: 'Osaka' }, admin),
      ).resolves.toBeDefined();
    });

    it('should allow admin to edit any field on completed trip', async () => {
      const trip = createMockTrip({ userId: 'user-1', status: 'completed' });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, title: 'Fixed' });

      await expect(
        useCase.execute('trip-1', { title: 'Fixed' }, admin),
      ).resolves.toBeDefined();
    });
  });

  describe('date validation on update', () => {
    it('should reject endDate before startDate', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute(
          'trip-1',
          { startDate: '2026-09-25', endDate: '2026-09-15' },
          user,
        ),
      ).rejects.toThrow(ValidationException);
    });

    it('should reject changing only startDate making it after endDate', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { startDate: '2026-09-30' }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should reject changing only endDate making it before startDate', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { endDate: '2026-09-10' }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should allow valid date update', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-10'),
      });

      await expect(
        useCase.execute(
          'trip-1',
          { startDate: '2026-10-01', endDate: '2026-10-10' },
          user,
        ),
      ).resolves.toBeDefined();
    });

    it('should allow changing only startDate if endDate still after', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        startDate: new Date('2026-09-20'),
      });

      await expect(
        useCase.execute('trip-1', { startDate: '2026-09-20' }, user),
      ).resolves.toBeDefined();
    });
  });
});
