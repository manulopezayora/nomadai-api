import { User } from '../../domain/entities/user.entity';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
