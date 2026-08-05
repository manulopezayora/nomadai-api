import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { ListTripsUseCase } from './list-trips.use-case';

describe('ListTripsUseCase', () => {
  let useCase: ListTripsUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new ListTripsUseCase(mockTripRepo);
  });

  it('should return all trips for user', async () => {
    const trips = [
      createMockTrip({ id: 'trip-1' }),
      createMockTrip({ id: 'trip-2' }),
    ];
    mockTripRepo.findByUserId.mockResolvedValue(trips);

    const result = await useCase.execute('user-1');

    expect(result).toEqual(trips);
    expect(mockTripRepo.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('should return empty array when user has no trips', async () => {
    mockTripRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-no-trips');

    expect(result).toEqual([]);
  });
});
