import {
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Body,
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
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../../domain/enums/user-role.enum';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @Inject(ListUsersUseCase)
    private readonly listUsersUseCase: ListUsersUseCase,
    @Inject(UpdateUserUseCase)
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async findAll() {
    return this.listUsersUseCase.execute();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
        role: {
          type: 'string',
          enum: ['USER', 'ADMIN'],
          description: 'User role (admin only, not on self)',
        },
        isActive: {
          type: 'boolean',
          example: true,
          description: 'Active status (admin only, not on self)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own profile',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.updateUserUseCase.execute(id, dto, user);
  }
}
