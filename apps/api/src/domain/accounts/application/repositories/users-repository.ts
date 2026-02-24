import type { User } from '../../enterprise/entities/user';

export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}
