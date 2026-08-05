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
import { GetTripUseCase } from '../../application/use-cases/trips/get-trip.use-case';
import { ListTripsUseCase } from '../../application/use-cases/trips/list-trips.use-case';
import { UpdateTripUseCase } from '../../application/use-cases/trips/update-trip.use-case';
import { DeleteTripUseCase } from '../../application/use-cases/trips/delete-trip.use-case';
import { CreateTripDto } from '../../application/dto/create-trip.dto';
import { UpdateTripDto } from '../../application/dto/update-trip.dto';
import { PaginationDto } from '../../application/dto/pagination.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import type { UserPayload } from '../../shared/types/user-payload';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(
    @Inject(CreateTripUseCase)
    private readonly createTripUseCase: CreateTripUseCase,
    @Inject(GetTripUseCase)
    private readonly getTripUseCase: GetTripUseCase,
    @Inject(ListTripsUseCase)
    private readonly listTripsUseCase: ListTripsUseCase,
    @Inject(UpdateTripUseCase)
    private readonly updateTripUseCase: UpdateTripUseCase,
    @Inject(DeleteTripUseCase)
    private readonly deleteTripUseCase: DeleteTripUseCase,
  ) {}

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
