import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { UpdateTripUseCase } from './update-trip.use-case';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { TripStatus } from '../../../domain/enums/trip-status.enum';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

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

  it('should throw ForbiddenException when user does not own trip', async () => {
    const trip = createMockTrip({ userId: 'user-2' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(
      useCase.execute('trip-1', { title: 'New' }, user),
    ).rejects.toThrow(ForbiddenException);
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
        travelStyle: TravelStyle.MID,
      },
    });
  });

  it('should update only travelStyle when interests not provided', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.update.mockResolvedValue(trip);

    await useCase.execute('trip-1', { travelStyle: TravelStyle.LUXURY }, user);

    expect(mockTripRepo.update).toHaveBeenCalledWith('trip-1', {
      preferences: {
        interests: ['culture', 'food'],
        travelStyle: TravelStyle.LUXURY,
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
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.PLANNING,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        status: TripStatus.ACTIVE,
      });

      const result = await useCase.execute(
        'trip-1',
        { status: TripStatus.ACTIVE },
        user,
      );

      expect(result.status).toBe(TripStatus.ACTIVE);
    });

    it('should allow active → completed', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        status: TripStatus.COMPLETED,
      });

      const result = await useCase.execute(
        'trip-1',
        { status: TripStatus.COMPLETED },
        user,
      );

      expect(result.status).toBe(TripStatus.COMPLETED);
    });

    it('should allow planning → completed', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.PLANNING,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        status: TripStatus.COMPLETED,
      });

      const result = await useCase.execute(
        'trip-1',
        { status: TripStatus.COMPLETED },
        user,
      );

      expect(result.status).toBe(TripStatus.COMPLETED);
    });

    it('should reject completed → planning', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.COMPLETED,
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { status: TripStatus.PLANNING }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should reject active → planning', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { status: TripStatus.PLANNING }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should reject completed → active', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.COMPLETED,
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { status: TripStatus.ACTIVE }, user),
      ).rejects.toThrow(ValidationException);
    });

    it('should allow admin to change any status transition', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.COMPLETED,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        status: TripStatus.PLANNING,
      });

      const result = await useCase.execute(
        'trip-1',
        { status: TripStatus.PLANNING },
        admin,
      );

      expect(result.status).toBe(TripStatus.PLANNING);
    });

    it('should allow admin to change active → planning', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({
        ...trip,
        status: TripStatus.PLANNING,
      });

      const result = await useCase.execute(
        'trip-1',
        { status: TripStatus.PLANNING },
        admin,
      );

      expect(result.status).toBe(TripStatus.PLANNING);
    });
  });

  describe('field restrictions by status', () => {
    it('should allow all fields on planning trip', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.PLANNING,
      });
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
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { destination: 'Osaka' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject startDate change on active trip', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { startDate: '2026-10-01' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow title change on active trip', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, title: 'Updated' });

      await expect(
        useCase.execute('trip-1', { title: 'Updated' }, user),
      ).resolves.toBeDefined();
    });

    it('should reject all fields on completed trip', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.COMPLETED,
      });
      mockTripRepo.findById.mockResolvedValue(trip);

      await expect(
        useCase.execute('trip-1', { title: 'Updated' }, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to edit any field on active trip', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.ACTIVE,
      });
      mockTripRepo.findById.mockResolvedValue(trip);
      mockTripRepo.update.mockResolvedValue({ ...trip, destination: 'Osaka' });

      await expect(
        useCase.execute('trip-1', { destination: 'Osaka' }, admin),
      ).resolves.toBeDefined();
    });

    it('should allow admin to edit any field on completed trip', async () => {
      const trip = createMockTrip({
        userId: 'user-1',
        status: TripStatus.COMPLETED,
      });
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
