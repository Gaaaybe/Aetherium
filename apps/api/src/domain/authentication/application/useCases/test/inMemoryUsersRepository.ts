import type { User } from '@/domain/authentication/enterprise/entities/user';
import type { UsersRepository } from '../../repositories/usersRepository';

export class InMemoryUsersRepository implements UsersRepository {
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
