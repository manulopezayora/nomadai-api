import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/enums/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'avatars/user123',
    description: 'Cloudinary public ID for avatar',
  })
  @IsString()
  @IsOptional()
  avatarPublicId?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'User role (admin only, not on self)',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: false,
    description: 'Active status (admin only, not on self)',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
