import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { AlreadyExistsError } from '@/core/errors/alreadyExistsError';
import type { RegisterUserUseCase } from '@/domain/accounts/application/useCases/register-user';
import { Public } from '@/infrastructure/auth/public';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';

const registerUserBodySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6),
  masterConfirm: z.boolean().optional(),
});

type RegisterUserBodySchema = z.infer<typeof registerUserBodySchema>;

@Controller('/users')
@Public()
export class RegisterUserController {
  constructor(private registerUser: RegisterUserUseCase) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(registerUserBodySchema))
  async handle(@Body() body: RegisterUserBodySchema) {
    const { name, email, password, masterConfirm } = body;

    const result = await this.registerUser.execute({
      name,
      email,
      password,
      masterConfirm,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case AlreadyExistsError:
          throw new ConflictException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
