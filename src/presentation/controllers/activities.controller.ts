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
import { CreateActivityUseCase } from '../../application/use-cases/activities/create-activity.use-case';
import { UpdateActivityUseCase } from '../../application/use-cases/activities/update-activity.use-case';
import { DeleteActivityUseCase } from '../../application/use-cases/activities/delete-activity.use-case';
import { CreateActivityDto } from '../../application/dto/create-activity.dto';
import { UpdateActivityDto } from '../../application/dto/update-activity.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { UserPayload } from '../../shared/types/user-payload';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/days/:dayId/activities')
export class ActivitiesController {
  constructor(
    @Inject(CreateActivityUseCase)
    private readonly createActivityUseCase: CreateActivityUseCase,
    @Inject(UpdateActivityUseCase)
    private readonly updateActivityUseCase: UpdateActivityUseCase,
    @Inject(DeleteActivityUseCase)
    private readonly deleteActivityUseCase: DeleteActivityUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add an activity to a day plan' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'dayId', description: 'Day Plan ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', example: 'Visit Senso-ji Temple' },
        description: { type: 'string', example: 'Oldest temple in Tokyo' },
        location: { type: 'string', example: 'Senso-ji, Asakusa' },
        latitude: { type: 'number', example: 35.7148 },
        longitude: { type: 'number', example: 139.7967 },
        startTime: { type: 'string', example: '09:00' },
        endTime: { type: 'string', example: '12:00' },
        cost: { type: 'number', example: 0 },
        bookingUrl: {
          type: 'string',
          example: 'https://klook.com/activity/123',
        },
        category: {
          type: 'string',
          enum: [
            'museum',
            'restaurant',
            'temple',
            'shopping',
            'transport',
            'hotel',
            'activity',
            'other',
          ],
          example: 'temple',
        },
        placeId: { type: 'string', example: 'ChIJ1dtyCfKJGGARixz6lgJT3Ys' },
        order: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Day plan not found' })
  async create(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateActivityDto,
  ) {
    return this.createActivityUseCase.execute(tripId, dayId, dto, user.userId);
  }

  @Patch(':activityId')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'dayId', description: 'Day Plan ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated title' },
        description: { type: 'string', example: 'Updated description' },
        location: { type: 'string', example: 'New location' },
        latitude: { type: 'number', example: 35.7148 },
        longitude: { type: 'number', example: 139.7967 },
        startTime: { type: 'string', example: '10:00' },
        endTime: { type: 'string', example: '14:00' },
        cost: { type: 'number', example: 15 },
        bookingUrl: { type: 'string', example: 'https://booking.com/123' },
        category: {
          type: 'string',
          enum: [
            'museum',
            'restaurant',
            'temple',
            'shopping',
            'transport',
            'hotel',
            'activity',
            'other',
          ],
        },
        placeId: { type: 'string' },
        order: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.updateActivityUseCase.execute(
      tripId,
      dayId,
      activityId,
      dto,
      user.userId,
    );
  }

  @Delete(':activityId')
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'dayId', description: 'Day Plan ID' })
  @ApiParam({ name: 'activityId', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.deleteActivityUseCase.execute(
      tripId,
      dayId,
      activityId,
      user.userId,
    );
    return { message: 'Activity deleted successfully' };
  }
}
