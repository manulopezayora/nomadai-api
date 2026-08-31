import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { GetTripUseCase } from './get-trip.use-case';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';

describe('GetTripUseCase', () => {
  let useCase: GetTripUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new GetTripUseCase(mockTripRepo);
  });

  it('should return trip with details when found and owned by user', async () => {
    const trip = createMockTrip({ id: 'trip-1', userId: 'user-1' });
    const tripWithDetails = { ...trip, dayPlans: [] };
    mockTripRepo.findByIdWithDetails.mockResolvedValue(tripWithDetails);

    const result = await useCase.execute('trip-1', 'user-1');

    expect(result).toEqual(tripWithDetails);
    expect(result.dayPlans).toEqual([]);
    expect(mockTripRepo.findByIdWithDetails).toHaveBeenCalledWith('trip-1');
  });

  it('should throw TripNotFoundException when trip not found', async () => {
    mockTripRepo.findByIdWithDetails.mockResolvedValue(null);

    await expect(useCase.execute('trip-999', 'user-1')).rejects.toThrow(
      TripNotFoundException,
    );
  });

  it('should throw TripNotFoundException when user does not own trip', async () => {
    const trip = createMockTrip({ id: 'trip-1', userId: 'user-2' });
    const tripWithDetails = { ...trip, dayPlans: [] };
    mockTripRepo.findByIdWithDetails.mockResolvedValue(tripWithDetails);

    await expect(useCase.execute('trip-1', 'user-1')).rejects.toThrow(
      TripNotFoundException,
    );
  });
});
