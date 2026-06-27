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

const acquireBenefitBodySchema = z.object({
  benefitName: z.string().min(1),
  targetDegree: z.number().int().min(1),
});

type AcquireBenefitBodySchema = z.infer<typeof acquireBenefitBodySchema>;

@Controller('/characters/:characterId/benefits')
export class AcquireBenefitController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(acquireBenefitBodySchema)) body: AcquireBenefitBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const { character } = await this.charactersService.acquireBenefit(
        characterId,
        user.sub,
        body.benefitName,
        body.targetDegree,
      );

      return CharacterPresenter.toHTTP(character);
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
