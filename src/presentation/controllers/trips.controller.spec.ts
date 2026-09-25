jest.mock(
  '../../application/use-cases/trips/save-generated-trip.use-case',
  () => ({
    SaveGeneratedTripUseCase: jest
      .fn()
      .mockImplementation(() => ({ execute: jest.fn() })),
  }),
);

import { TripsController } from './trips.controller';
import { CreateTripUseCase } from '../../application/use-cases/trips/create-trip.use-case';
import { GenerateTripUseCase } from '../../application/use-cases/trips/generate-trip.use-case';
import { GenerateItineraryPreviewUseCase } from '../../application/use-cases/trips/generate-itinerary-preview.use-case';
import { GenerateFlightsPreviewUseCase } from '../../application/use-cases/trips/generate-flights-preview.use-case';
import { GenerateHotelsPreviewUseCase } from '../../application/use-cases/trips/generate-hotels-preview.use-case';
import { SaveGeneratedTripUseCase } from '../../application/use-cases/trips/save-generated-trip.use-case';
import { GetTripUseCase } from '../../application/use-cases/trips/get-trip.use-case';
import { ListTripsUseCase } from '../../application/use-cases/trips/list-trips.use-case';
import { ListAllTripsUseCase } from '../../application/use-cases/trips/list-all-trips.use-case';
import { UpdateTripUseCase } from '../../application/use-cases/trips/update-trip.use-case';
import { DeleteTripUseCase } from '../../application/use-cases/trips/delete-trip.use-case';
import { createMockTrip } from '../../../test/mocks/trip.factory';
import { UserRole } from '../../domain/enums/user-role.enum';

describe('TripsController', () => {
  let controller: TripsController;
  let mockCreateTrip: jest.Mocked<CreateTripUseCase>;
  let mockGenerateTrip: jest.Mocked<GenerateTripUseCase>;
  let mockGenerateItineraryPreview: jest.Mocked<GenerateItineraryPreviewUseCase>;
  let mockGenerateFlightsPreview: jest.Mocked<GenerateFlightsPreviewUseCase>;
  let mockGenerateHotelsPreview: jest.Mocked<GenerateHotelsPreviewUseCase>;
  let mockSaveGeneratedTrip: jest.Mocked<SaveGeneratedTripUseCase>;
  let mockGetTrip: jest.Mocked<GetTripUseCase>;
  let mockListTrips: jest.Mocked<ListTripsUseCase>;
  let mockListAllTrips: jest.Mocked<ListAllTripsUseCase>;
  let mockUpdateTrip: jest.Mocked<UpdateTripUseCase>;
  let mockDeleteTrip: jest.Mocked<DeleteTripUseCase>;

  const mockUser = {
    userId: 'user-123',
    email: 'test@test.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    mockCreateTrip = { execute: jest.fn() } as any;
    mockGenerateTrip = { execute: jest.fn() } as any;
    mockGenerateItineraryPreview = { execute: jest.fn() } as any;
    mockGenerateFlightsPreview = { execute: jest.fn() } as any;
    mockGenerateHotelsPreview = { execute: jest.fn() } as any;
    mockSaveGeneratedTrip = { execute: jest.fn() } as any;
    mockGetTrip = { execute: jest.fn() } as any;
    mockListTrips = { execute: jest.fn() } as any;
    mockListAllTrips = { execute: jest.fn() } as any;
    mockUpdateTrip = { execute: jest.fn() } as any;
    mockDeleteTrip = { execute: jest.fn() } as any;

    controller = new TripsController(
      mockCreateTrip,
      mockGenerateTrip,
      mockGenerateItineraryPreview,
      mockGenerateFlightsPreview,
      mockGenerateHotelsPreview,
      mockSaveGeneratedTrip,
      mockGetTrip,
      mockListTrips,
      mockListAllTrips,
      mockUpdateTrip,
      mockDeleteTrip,
    );
  });

  describe('create', () => {
    it('should create a trip and return it', async () => {
      const trip = createMockTrip();
      mockCreateTrip.execute.mockResolvedValue(trip);

      const result = await controller.create(mockUser, {
        title: 'Japan Trip',
        destination: 'Tokyo',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        interests: ['culture'],
      });

      expect(result).toEqual(trip);
      expect(mockCreateTrip.execute).toHaveBeenCalledWith(
        {
          title: 'Japan Trip',
          destination: 'Tokyo',
          startDate: '2026-09-15',
          endDate: '2026-09-25',
          interests: ['culture'],
        },
        'user-123',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated trips for user', async () => {
      const trips = [
        createMockTrip({ id: 'trip-1' }),
        createMockTrip({ id: 'trip-2' }),
      ];
      const paginatedResponse = {
        data: trips,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockListTrips.execute.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(mockUser, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(paginatedResponse);
      expect(mockListTrips.execute).toHaveBeenCalledWith('user-123', 1, 20);
    });
  });

  describe('findAllAdmin', () => {
    it('should return paginated trips for admin', async () => {
      const trips = [
        createMockTrip({ id: 'trip-1' }),
        createMockTrip({ id: 'trip-2' }),
      ];
      const paginatedResponse = {
        data: trips,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      mockListAllTrips.execute.mockResolvedValue(paginatedResponse);

      const result = await controller.findAllAdmin({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResponse);
      expect(mockListAllTrips.execute).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('findOne', () => {
    it('should return a trip by id', async () => {
      const trip = createMockTrip({ id: 'trip-1' });
      mockGetTrip.execute.mockResolvedValue({ ...trip, dayPlans: [] } as never);

      const result = await controller.findOne('trip-1', mockUser);

      expect(result).toMatchObject(trip);
      expect(mockGetTrip.execute).toHaveBeenCalledWith('trip-1', 'user-123');
    });
  });

  describe('update', () => {
    it('should update a trip', async () => {
      const updated = createMockTrip({ title: 'Updated' });
      mockUpdateTrip.execute.mockResolvedValue(updated);

      const result = await controller.update('trip-1', mockUser, {
        title: 'Updated',
      });

      expect(result).toEqual(updated);
      expect(mockUpdateTrip.execute).toHaveBeenCalledWith(
        'trip-1',
        { title: 'Updated' },
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a trip and return success message', async () => {
      mockDeleteTrip.execute.mockResolvedValue(undefined);

      const result = await controller.remove('trip-1', mockUser);

      expect(result).toEqual({ message: 'Trip deleted successfully' });
      expect(mockDeleteTrip.execute).toHaveBeenCalledWith('trip-1', 'user-123');
    });
  });

  describe('generate', () => {
    it('should generate a trip preview and return it', async () => {
      const generatedTrip = {
        trip: {
          title: '10 Days in Japan',
          destination: 'Japan',
          startDate: '2026-09-15',
          endDate: '2026-09-25',
          budget: null,
          travelerCount: 1,
          interests: ['culture', 'food'],
          travelStyle: 'mid',
        },
        flights: [],
        hotels: [],
        itinerary: { days: [] },
      };
      mockGenerateTrip.execute.mockResolvedValue(generatedTrip as never);

      const result = await controller.generate(mockUser, {
        prompt: '10 days in Japan, culture and relax',
      });

      expect(result).toEqual(generatedTrip);
      expect(mockGenerateTrip.execute).toHaveBeenCalledWith({
        prompt: '10 days in Japan, culture and relax',
      });
    });
  });

  describe('saveGenerated', () => {
    it('should save a generated trip and return the created trip', async () => {
      const trip = createMockTrip({ id: 'trip-new' });
      mockSaveGeneratedTrip.execute.mockResolvedValue(trip);

      const result = await controller.saveGenerated(mockUser, {
        title: '10 Days in Japan',
        destination: 'Japan',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        interests: ['culture', 'food'],
        flights: [],
        hotels: [],
        itinerary: { days: [] },
      });

      expect(result).toEqual(trip);
      expect(mockSaveGeneratedTrip.execute).toHaveBeenCalled();
    });
  });
});
