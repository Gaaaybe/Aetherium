import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository';
import type { User } from '@/domain/accounts/enterprise/entities/user';

export class InMemoryUsersRepository extends UsersRepository {
  public items: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email === email);
    return user ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id.toString() === id);
    return user ?? null;
  }

  async create(user: User): Promise<User> {
    this.items.push(user);
    return user;
  }
}
