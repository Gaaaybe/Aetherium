import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { ResourceNotFoundError, NotAllowedError, DomainValidationError } from '@/modules/character-manager/errors/character-errors';

const addRunicsBodySchema = z.object({
  amount: z.number().int().min(1),
});

type AddRunicsBodySchema = z.infer<typeof addRunicsBodySchema>;

@Controller('/characters/:characterId/runics/add')
export class AddRunicsController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(addRunicsBodySchema)) body: AddRunicsBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.addRunics(
        characterId,
        user.sub,
        body.amount,
      );

      return CharacterPresenter.toHTTP(character);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundError || error.constructor.name === 'ResourceNotFoundError') {
        throw new NotFoundException(error.message);
      }

      if (error instanceof NotAllowedError || error.constructor.name === 'NotAllowedError') {
        throw new ForbiddenException(error.message);
      }

      if (error instanceof DomainValidationError || error.constructor.name === 'DomainValidationError') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
