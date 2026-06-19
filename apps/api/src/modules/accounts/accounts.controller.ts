import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { Public } from '@/infrastructure/auth/public';
import { ZodValidationPipe } from '@/infrastructure/http/pipes/zod-validation-pipe';
import { AccountsService } from './accounts.service';
import {
  registerUserBodySchema,
  authenticateBodySchema,
} from './dto/accounts.dto';
import type {
  RegisterUserBodySchema,
  AuthenticateBodySchema,
} from './dto/accounts.dto';

@Controller('/users')
@Public()
export class RegisterUserController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(registerUserBodySchema))
  async handle(@Body() body: RegisterUserBodySchema) {
    await this.accountsService.registerUser(body);
  }
}

@Controller('/auth')
@Public()
export class AuthenticateController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const result = await this.accountsService.authenticateUser(body);
    return {
      access_token: result.accessToken,
    };
  }
}
