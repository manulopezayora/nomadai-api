import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { DeleteTripUseCase } from './delete-trip.use-case';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';

describe('DeleteTripUseCase', () => {
  let useCase: DeleteTripUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new DeleteTripUseCase(mockTripRepo);
  });

  it('should delete trip successfully', async () => {
    const trip = createMockTrip({ id: 'trip-1', userId: 'user-1' });
    mockTripRepo.findById.mockResolvedValue(trip);
    mockTripRepo.delete.mockResolvedValue(undefined);

    await useCase.execute('trip-1', 'user-1');

    expect(mockTripRepo.delete).toHaveBeenCalledWith('trip-1');
  });

  it('should throw TripNotFoundException when trip not found', async () => {
    mockTripRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('trip-999', 'user-1')).rejects.toThrow(
      TripNotFoundException,
    );
    expect(mockTripRepo.delete).not.toHaveBeenCalled();
  });

  it('should throw TripNotFoundException when user does not own trip', async () => {
    const trip = createMockTrip({ id: 'trip-1', userId: 'user-2' });
    mockTripRepo.findById.mockResolvedValue(trip);

    await expect(useCase.execute('trip-1', 'user-1')).rejects.toThrow(
      TripNotFoundException,
    );
    expect(mockTripRepo.delete).not.toHaveBeenCalled();
  });
});
