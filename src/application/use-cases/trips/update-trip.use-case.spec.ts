import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { UpdateTripUseCase } from './update-trip.use-case';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';

describe('UpdateTripUseCase', () => {
  let useCase: UpdateTripUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new UpdateTripUseCase(mockTripRepo);
  });

  it('should throw TripNotFoundException when trip not found', async () => {
    mockTripRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('trip-999', { title: 'New' }, 'user-1'),
    ).rejects.toThrow(TripNotFoundException);
  });

  it('should throw TripNotFoundException when user does not own trip', async () => {
    const trip = createMockTrip({ userId: 'user-2' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(
      useCase.execute('trip-1', { title: 'New' }, 'user-1'),
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
      'user-1',
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
      useCase.execute('trip-1', { title: '  ' }, 'user-1'),
    ).rejects.toThrow(ValidationException);
  });

  it('should update preferences with new interests', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.update.mockResolvedValue(trip);

    await useCase.execute(
      'trip-1',
      { interests: ['nightlife', 'shopping'] },
      'user-1',
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

    await useCase.execute('trip-1', { travelStyle: 'luxury' }, 'user-1');

    expect(mockTripRepo.update).toHaveBeenCalledWith('trip-1', {
      preferences: {
        interests: ['culture', 'food'],
        travelStyle: 'luxury',
      },
    });
  });

  it('should update status', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.update.mockResolvedValue({
      ...trip,
      status: 'active',
    });

    const result = await useCase.execute(
      'trip-1',
      { status: 'active' },
      'user-1',
    );

    expect(result.status).toBe('active');
  });

  it('should throw ValidationException for empty interests', async () => {
    const trip = createMockTrip({ userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(
      useCase.execute('trip-1', { interests: [] }, 'user-1'),
    ).rejects.toThrow(ValidationException);
  });
});
