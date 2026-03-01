import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { AlreadyExistsError } from '@/core/errors/alreadyExistsError';
import { User } from '../../enterprise/entities/user';
import { UserRole } from '../../enterprise/entities/value-objects/userRole';
import { HashGenerator } from '../cryptography/hash-generator';
import { UsersRepository } from '../repositories/users-repository';

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

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    email,
    password,
    masterConfirm,
  }: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
    const passwordHash = await this.hashGenerator.hash(password);

    const roles: UserRole[] =
      masterConfirm === true ? [UserRole.PLAYER, UserRole.MASTER] : [UserRole.PLAYER];

    const userWithSameEmail = await this.usersRepository.findByEmail(email);
    if (userWithSameEmail) {
      return left(new AlreadyExistsError());
    }

    const user = User.create({
      name,
      email,
      password: passwordHash,
      roles,
    });

    await this.usersRepository.create(user);

    return right({ user });
  }
}
