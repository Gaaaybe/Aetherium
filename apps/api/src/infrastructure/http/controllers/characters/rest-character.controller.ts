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
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharactersService } from '@/modules/character-manager/characters.service';
import {
  DomainValidationError,
  NotAllowedError,
  ResourceNotFoundError,
} from '@/modules/character-manager/errors/character-errors';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';

const restBodySchema = z.object({
  quality: z.enum(['RUIM', 'NORMAL', 'CONFORTAVEL', 'LUXUOSA']).default('NORMAL'),
  durationHours: z.number().int().min(1).default(8),
  hasCare: z.boolean().default(false),
  useGastronomicRule: z.boolean().default(false),
  consumedMeal: z.boolean().default(false),
  customMaxPV: z.number().int().min(1).optional(),
  customMaxPE: z.number().int().min(1).optional(),
});

type RestBodySchema = z.infer<typeof restBodySchema>;

@Controller('/characters/:characterId/rest')
export class RestCharacterController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(restBodySchema)) body: RestBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const { character, pvChange, peChange } = await this.charactersService.rest(
        characterId,
        user.sub,
        body.quality,
        body.durationHours,
        body.hasCare,
        body.useGastronomicRule,
        body.consumedMeal,
        body.customMaxPV,
        body.customMaxPE,
      );

      const httpCharacter = CharacterPresenter.toHTTP(character);
      return {
        ...httpCharacter,
        restChange: {
          pvChange,
          peChange,
        },
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundError ||
        error.constructor.name === 'ResourceNotFoundError'
      ) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof NotAllowedError || error.constructor.name === 'NotAllowedError') {
        throw new ForbiddenException(error.message);
      }

      if (
        error instanceof DomainValidationError ||
        error.constructor.name === 'DomainValidationError'
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
