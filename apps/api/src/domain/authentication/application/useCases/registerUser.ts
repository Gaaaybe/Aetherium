import { hash } from 'bcryptjs';
import { type Either, left, right } from '@/core/either';
import { AlreadyExistsError } from '@/core/errors/alreadyExistsError';
import { User } from '../../enterprise/entities/user';
import { UserRole } from '../../enterprise/entities/value-objects/userRole';
import type { UsersRepository } from '../repositories/usersRepository';

interface RegisterUserUseCaseRequest {
  name: string;
  email: string;
  password: string;
  masterConfirm?: boolean;
}

interface RegisterUserUseCaseResponseData {
  user: User;
}

type RegisterUserUseCaseResponse = Either<AlreadyExistsError, RegisterUserUseCaseResponseData>;

export class RegisterUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    name,
    email,
    password,
    masterConfirm,
  }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const passwordHash = await hash(password, 6);

    const userRole: UserRole = masterConfirm === true ? UserRole.MASTER : UserRole.PLAYER;

    const userWithSameEmail = await this.usersRepository.findByEmail(email);
    if (userWithSameEmail) {
      return left(new AlreadyExistsError());
    }

    const user = User.create({
      name,
      email,
      password: passwordHash,
      roles: [userRole],
    });

    await this.usersRepository.create(user);

    return right({ user });
  }
}
