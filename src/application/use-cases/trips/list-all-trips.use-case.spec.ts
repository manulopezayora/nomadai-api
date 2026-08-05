import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { ListAllTripsUseCase } from './list-all-trips.use-case';

describe('ListAllTripsUseCase', () => {
  let useCase: ListAllTripsUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new ListAllTripsUseCase(mockTripRepo);
  });

  it('should return paginated trips for admin', async () => {
    const trips = [
      createMockTrip({ id: 'trip-1' }),
      createMockTrip({ id: 'trip-2' }),
    ];
    mockTripRepo.findAll.mockResolvedValue(trips);
    mockTripRepo.count.mockResolvedValue(2);

    const result = await useCase.execute(1, 20);

    expect(result.data).toEqual(trips);
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(mockTripRepo.findAll).toHaveBeenCalledWith(0, 20);
  });

  it('should return empty array when no trips exist', async () => {
    mockTripRepo.findAll.mockResolvedValue([]);
    mockTripRepo.count.mockResolvedValue(0);

    const result = await useCase.execute(1, 20);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should calculate correct offset for page 2', async () => {
    const trips = [createMockTrip({ id: 'trip-3' })];
    mockTripRepo.findAll.mockResolvedValue(trips);
    mockTripRepo.count.mockResolvedValue(25);

    await useCase.execute(2, 10);

    expect(mockTripRepo.findAll).toHaveBeenCalledWith(10, 10);
  });

  it('should calculate correct totalPages', async () => {
    mockTripRepo.findAll.mockResolvedValue([]);
    mockTripRepo.count.mockResolvedValue(25);

    const result = await useCase.execute(1, 10);

    expect(result.meta.totalPages).toBe(3);
  });
});
