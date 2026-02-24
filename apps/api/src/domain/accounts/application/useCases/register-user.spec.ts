import { FakeHashGenerator } from '@test/fakes/fakeHashGenerator';
import { InMemoryUsersRepository } from '@test/repositories/inMemoryUsersRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlreadyExistsError } from '@/core/errors/alreadyExistsError';
import { RegisterUserUseCase } from './register-user';

let usersRepository: InMemoryUsersRepository;
let hashGenerator: FakeHashGenerator;
let sut: RegisterUserUseCase;

describe('Register User Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    hashGenerator = new FakeHashGenerator();
    sut = new RegisterUserUseCase(usersRepository, hashGenerator);
  });

  it('should be able to register a new user as player by default', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.user.name).toBe('John Doe');
      expect(result.value.user.email).toBe('john@example.com');
      expect(result.value.user.isPlayer()).toBe(true);
      expect(result.value.user.isMaster()).toBe(false);
    }
  });

  it('should be able to register a new user as master when masterConfirm is true', async () => {
    const result = await sut.execute({
      name: 'Master User',
      email: 'master@example.com',
      password: '123456',
      masterConfirm: true,
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.user.name).toBe('Master User');
      expect(result.value.user.isMaster()).toBe(true);
      expect(result.value.user.isPlayer()).toBe(true);
    }
  });

  it('should hash user password upon registration', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.user.password).toBe('hashed_123456');
    }
  });

  it('should not be able to register with same email twice', async () => {
    const email = 'john@example.com';

    await sut.execute({
      name: 'John Doe',
      email,
      password: '123456',
    });

    const result = await sut.execute({
      name: 'John Doe',
      email,
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AlreadyExistsError);
  });

  it('should store user in repository', async () => {
    await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123456',
    });

    expect(usersRepository.items).toHaveLength(1);
    expect(usersRepository.items[0].email).toBe('john@example.com');
  });

  it('should be able to register multiple users with different emails', async () => {
    await sut.execute({
      name: 'User One',
      email: 'user1@example.com',
      password: '123456',
    });

    await sut.execute({
      name: 'User Two',
      email: 'user2@example.com',
      password: '123456',
    });

    expect(usersRepository.items).toHaveLength(2);
    expect(usersRepository.items[0].email).toBe('user1@example.com');
    expect(usersRepository.items[1].email).toBe('user2@example.com');
  });
});
