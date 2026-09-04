import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { CheckStatusUseCase } from '../../application/use-cases/auth/check-status.use-case';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { UserPayload } from '../../shared/types/user-payload';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegisterUseCase)
    private readonly registerUseCase: RegisterUseCase,
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    @Inject(CheckStatusUseCase)
    private readonly checkStatusUseCase: CheckStatusUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 8, example: 'password123' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email or password' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 8, example: 'password123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT' })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: UserPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('check-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT and return full user data' })
  @ApiResponse({
    status: 200,
    description: 'User is authenticated, returns full user data',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async checkStatus(@CurrentUser() user: UserPayload) {
    return this.checkStatusUseCase.execute(user.userId);
  }
}
