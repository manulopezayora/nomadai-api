import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateDayPlanUseCase } from '../../application/use-cases/day-plans/create-day-plan.use-case';
import { UpdateDayPlanUseCase } from '../../application/use-cases/day-plans/update-day-plan.use-case';
import { DeleteDayPlanUseCase } from '../../application/use-cases/day-plans/delete-day-plan.use-case';
import { CreateDayPlanDto } from '../../application/dto/create-day-plan.dto';
import { UpdateDayPlanDto } from '../../application/dto/update-day-plan.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { UserPayload } from '../../shared/types/user-payload';

@ApiTags('Day Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/days')
export class DayPlansController {
  constructor(
    @Inject(CreateDayPlanUseCase)
    private readonly createDayPlanUseCase: CreateDayPlanUseCase,
    @Inject(UpdateDayPlanUseCase)
    private readonly updateDayPlanUseCase: UpdateDayPlanUseCase,
    @Inject(DeleteDayPlanUseCase)
    private readonly deleteDayPlanUseCase: DeleteDayPlanUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new day plan for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['dayNumber', 'date'],
      properties: {
        dayNumber: {
          type: 'number',
          example: 1,
          description: 'Day number within the trip',
        },
        date: {
          type: 'string',
          example: '2026-09-15',
          description: 'Date (ISO 8601)',
        },
        title: { type: 'string', example: 'Arrival in Tokyo' },
        notes: {
          type: 'string',
          example: 'Check in at hotel, explore Shibuya',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Day plan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async create(
    @Param('tripId') tripId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateDayPlanDto,
  ) {
    return this.createDayPlanUseCase.execute(tripId, dto, user.userId);
  }

  @Patch(':dayId')
  @ApiOperation({ summary: 'Update a day plan' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'dayId', description: 'Day Plan ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dayNumber: { type: 'number', example: 2 },
        date: { type: 'string', example: '2026-09-16' },
        title: { type: 'string', example: 'Exploring Kyoto temples' },
        notes: {
          type: 'string',
          example: 'Visit Fushimi Inari and Kinkaku-ji',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Day plan updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Day plan not found' })
  async update(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateDayPlanDto,
  ) {
    return this.updateDayPlanUseCase.execute(tripId, dayId, dto, user.userId);
  }

  @Delete(':dayId')
  @ApiOperation({ summary: 'Delete a day plan and all its activities' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'dayId', description: 'Day Plan ID' })
  @ApiResponse({ status: 200, description: 'Day plan deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Day plan not found' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.deleteDayPlanUseCase.execute(tripId, dayId, user.userId);
    return { message: 'Day plan deleted successfully' };
  }
}
