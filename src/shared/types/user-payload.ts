import { UserRole } from '../../domain/enums/user-role.enum';

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
}
