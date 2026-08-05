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

  it('should return paginated trips for user', async () => {
    const trips = [
      createMockTrip({ id: 'trip-1' }),
      createMockTrip({ id: 'trip-2' }),
    ];
    mockTripRepo.findByUserId.mockResolvedValue(trips);
    mockTripRepo.countByUserId.mockResolvedValue(2);

    const result = await useCase.execute('user-1', 1, 20);

    expect(result.data).toEqual(trips);
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(mockTripRepo.findByUserId).toHaveBeenCalledWith('user-1', 0, 20);
  });

  it('should return empty array when user has no trips', async () => {
    mockTripRepo.findByUserId.mockResolvedValue([]);
    mockTripRepo.countByUserId.mockResolvedValue(0);

    const result = await useCase.execute('user-no-trips', 1, 20);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should calculate correct offset for page 2', async () => {
    const trips = [createMockTrip({ id: 'trip-3' })];
    mockTripRepo.findByUserId.mockResolvedValue(trips);
    mockTripRepo.countByUserId.mockResolvedValue(25);

    await useCase.execute('user-1', 2, 10);

    expect(mockTripRepo.findByUserId).toHaveBeenCalledWith('user-1', 10, 10);
  });

  it('should calculate correct totalPages', async () => {
    mockTripRepo.findByUserId.mockResolvedValue([]);
    mockTripRepo.countByUserId.mockResolvedValue(25);

    const result = await useCase.execute('user-1', 1, 10);

    expect(result.meta.totalPages).toBe(3);
  });
});
