import type { User } from '@/domain/authentication/enterprise/entities/user';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}
