import { beforeEach, describe, expect, it } from 'vitest';
import { AuthenticateUserUseCase } from './authenticate-user';
import { InMemoryUsersRepository } from './test/inMemoryUsersRepository';
import { FakeHashComparer } from './test/fakeHashComparer';
import { FakeEncrypter } from './test/fakeEncrypter';
import { FakeHashGenerator } from './test/fakeHashGenerator';
import { WrongCredentialsError } from './errors/wrong-credentials-error';
import { User } from '../../enterprise/entities/user';
import { UserRole } from '../../enterprise/entities/value-objects/userRole';

let usersRepository: InMemoryUsersRepository;
let hashComparer: FakeHashComparer;
let encrypter: FakeEncrypter;
let hashGenerator: FakeHashGenerator;
let sut: AuthenticateUserUseCase;

describe('Authenticate User Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    hashComparer = new FakeHashComparer();
    encrypter = new FakeEncrypter();
    hashGenerator = new FakeHashGenerator();
    sut = new AuthenticateUserUseCase(usersRepository, hashComparer, encrypter);
  });

  it('should be able to authenticate a player user', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: await hashGenerator.hash('123456'),
      roles: [UserRole.PLAYER],
    });

    await usersRepository.create(user);

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.accessToken).toBeTruthy();
      const payload = JSON.parse(result.value.accessToken);
      expect(payload.email).toBe('john@example.com');
      expect(payload.isMaster).toBe(false);
      expect(payload.sub).toBe(user.id.toString());
    }
  });

  it('should be able to authenticate a master user', async () => {
    const user = User.create({
      name: 'Master User',
      email: 'master@example.com',
      password: await hashGenerator.hash('123456'),
      roles: [UserRole.MASTER],
    });

    await usersRepository.create(user);

    const result = await sut.execute({
      email: 'master@example.com',
      password: '123456',
    });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.accessToken).toBeTruthy();
      const payload = JSON.parse(result.value.accessToken);
      expect(payload.email).toBe('master@example.com');
      expect(payload.isMaster).toBe(true);
      expect(payload.sub).toBe(user.id.toString());
    }
  });

  it('should not be able to authenticate with wrong email', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
      password: '123456',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(WrongCredentialsError);
  });

  it('should not be able to authenticate with wrong password', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: await hashGenerator.hash('123456'),
      roles: [UserRole.PLAYER],
    });

    await usersRepository.create(user);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'wrong-password',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(WrongCredentialsError);
  });
});
