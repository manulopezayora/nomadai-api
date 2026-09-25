import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateTripUseCase } from '../../application/use-cases/trips/create-trip.use-case';
import { GenerateTripUseCase } from '../../application/use-cases/trips/generate-trip.use-case';
import { SaveGeneratedTripUseCase } from '../../application/use-cases/trips/save-generated-trip.use-case';
import { GetTripUseCase } from '../../application/use-cases/trips/get-trip.use-case';
import { ListTripsUseCase } from '../../application/use-cases/trips/list-trips.use-case';
import { ListAllTripsUseCase } from '../../application/use-cases/trips/list-all-trips.use-case';
import { UpdateTripUseCase } from '../../application/use-cases/trips/update-trip.use-case';
import { DeleteTripUseCase } from '../../application/use-cases/trips/delete-trip.use-case';
import { CreateTripDto } from '../../application/dto/create-trip.dto';
import { GenerateTripDto } from '../../application/dto/generate-trip.dto';
import { SaveGeneratedTripDto } from '../../application/dto/save-generated-trip.dto';
import { UpdateTripDto } from '../../application/dto/update-trip.dto';
import { PaginationDto } from '../../application/dto/pagination.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserRole } from '../../domain/enums/user-role.enum';
import type { UserPayload } from '../../shared/types/user-payload';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(
    @Inject(CreateTripUseCase)
    private readonly createTripUseCase: CreateTripUseCase,
    @Inject(GenerateTripUseCase)
    private readonly generateTripUseCase: GenerateTripUseCase,
    @Inject(SaveGeneratedTripUseCase)
    private readonly saveGeneratedTripUseCase: SaveGeneratedTripUseCase,
    @Inject(GetTripUseCase)
    private readonly getTripUseCase: GetTripUseCase,
    @Inject(ListTripsUseCase)
    private readonly listTripsUseCase: ListTripsUseCase,
    @Inject(ListAllTripsUseCase)
    private readonly listAllTripsUseCase: ListAllTripsUseCase,
    @Inject(UpdateTripUseCase)
    private readonly updateTripUseCase: UpdateTripUseCase,
    @Inject(DeleteTripUseCase)
    private readonly deleteTripUseCase: DeleteTripUseCase,
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate trip preview from natural language prompt using AI',
    description:
      'Parses a natural language prompt and returns trip data (title, destination, dates, preferences). Returns preview without saving to DB. Use POST /trips/save-generated to persist, then POST /trips/:id/recommend/* for flights, hotels and itinerary.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: {
          type: 'string',
          example: '10 days in Japan, culture and relax',
          description: 'Natural language description of the trip',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Trip preview generated (not saved to DB)',
  })
  @ApiResponse({ status: 400, description: 'Invalid prompt' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 502, description: 'AI service error' })
  async generate(
    @CurrentUser() _user: UserPayload,
    @Body() dto: GenerateTripDto,
  ) {
    return this.generateTripUseCase.execute(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'destination', 'startDate', 'endDate', 'interests'],
      properties: {
        title: { type: 'string', example: 'Trip to Japan' },
        destination: { type: 'string', example: 'Tokyo' },
        startDate: { type: 'string', example: '2026-09-15' },
        endDate: { type: 'string', example: '2026-09-25' },
        budget: { type: 'number', example: 2000 },
        travelerCount: { type: 'number', example: 2, default: 1 },
        interests: {
          type: 'array',
          items: { type: 'string' },
          example: ['culture', 'food'],
        },
        travelStyle: {
          type: 'string',
          enum: ['budget', 'mid', 'luxury'],
          example: 'mid',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateTripDto) {
    return this.createTripUseCase.execute(dto, user.userId);
  }

  @Post('save-generated')
  @ApiOperation({
    summary: 'Save a generated trip with flights, hotels and itinerary',
    description:
      'Saves the full trip data from POST /trips/generate to the database in a single transaction.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'destination', 'startDate', 'endDate', 'interests'],
      properties: {
        title: { type: 'string', example: '10 Days in Japan' },
        destination: { type: 'string', example: 'Japan' },
        startDate: { type: 'string', example: '2026-09-15' },
        endDate: { type: 'string', example: '2026-09-25' },
        budget: { type: 'number', example: 5000 },
        travelerCount: { type: 'number', example: 2 },
        interests: {
          type: 'array',
          items: { type: 'string' },
          example: ['culture', 'food'],
        },
        travelStyle: { type: 'string', enum: ['budget', 'mid', 'luxury'] },
        flights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              airline: { type: 'string' },
              origin: { type: 'string' },
              destination: { type: 'string' },
              price: { type: 'number' },
            },
          },
        },
        hotels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              city: { type: 'string' },
              pricePerNight: { type: 'number' },
            },
          },
        },
        itinerary: {
          type: 'object',
          properties: {
            days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dayNumber: { type: 'number' },
                  title: { type: 'string' },
                  activities: { type: 'array' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Trip saved with flights, hotels and itinerary',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveGenerated(
    @CurrentUser() user: UserPayload,
    @Body() dto: SaveGeneratedTripDto,
  ) {
    return this.saveGeneratedTripUseCase.execute(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all trips for current user' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of trips' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.listTripsUseCase.execute(
      user.userId,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all trips (admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of all trips' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async findAllAdmin(@Query() pagination: PaginationDto) {
    return this.listAllTripsUseCase.execute(pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.getTripUseCase.execute(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Trip' },
        destination: { type: 'string', example: 'Osaka' },
        startDate: { type: 'string', example: '2026-09-15' },
        endDate: { type: 'string', example: '2026-09-25' },
        budget: { type: 'number', example: 2500 },
        travelerCount: { type: 'number', example: 3 },
        interests: {
          type: 'array',
          items: { type: 'string' },
          example: ['culture', 'food', 'shopping'],
        },
        travelStyle: {
          type: 'string',
          enum: ['budget', 'mid', 'luxury'],
          example: 'luxury',
        },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'completed'],
          example: 'active',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Trip updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateTripDto,
  ) {
    return this.updateTripUseCase.execute(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.deleteTripUseCase.execute(id, user.userId);
    return { message: 'Trip deleted successfully' };
  }
}
