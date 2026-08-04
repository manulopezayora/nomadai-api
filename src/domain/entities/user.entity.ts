import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
