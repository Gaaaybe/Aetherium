import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
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
import { PowersService } from '@/modules/power-manager/powers.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';

const syncCharacterBodySchema = z.object({
  narrative: z
    .object({
      identity: z.string().min(1),
      origin: z.string().min(1),
      motivations: z.array(z.string().min(1)),
      complications: z.array(z.string().min(1)),
    })
    .optional(),
  symbol: z.string().trim().min(1).nullable().optional(),
  art: z.string().trim().min(1).nullable().optional(),
  inspiration: z.number().int().min(0).max(3).optional(),
  level: z.number().int().min(1).max(250).optional(),
  extraPda: z.number().int().min(0).optional(),
  pvChange: z.number().int().optional(),
  peChange: z.number().int().optional(),
  tempPvChange: z.number().int().min(0).optional(),
  tempPeChange: z.number().int().min(0).optional(),
  customMaxPV: z.number().int().min(1).optional(),
  customMaxPE: z.number().int().min(1).optional(),
  attributes: z
    .object({
      strength: z.object({
        baseValue: z.number().int().min(0),
        extraBonus: z.number().int().min(0).optional(),
      }),
      dexterity: z.object({
        baseValue: z.number().int().min(0),
        extraBonus: z.number().int().min(0).optional(),
      }),
      constitution: z.object({
        baseValue: z.number().int().min(0),
        extraBonus: z.number().int().min(0).optional(),
      }),
      intelligence: z.object({
        baseValue: z.number().int().min(0),
        extraBonus: z.number().int().min(0).optional(),
      }),
      wisdom: z.object({
        baseValue: z.number().int().min(0),
        extraBonus: z.number().int().min(0).optional(),
      }),
      charisma: z.object({
        baseValue: z.number().int().min(0),
        extraBonus: z.number().int().min(0).optional(),
      }),
      keyPhysical: z.enum(['strength', 'dexterity', 'constitution']),
      keyMental: z.enum(['intelligence', 'wisdom', 'charisma']),
    })
    .optional(),
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        state: z.enum(['EFFICIENT', 'NEUTRAL', 'INEFFICIENT']),
        trainingBonus: z.number().int().min(0).optional(),
        extraBonus: z.number().int().optional(),
      }),
    )
    .optional(),
  conditions: z.array(z.string().min(1)).optional(),
});

type SyncCharacterBodySchema = z.infer<typeof syncCharacterBodySchema>;

@Controller('/characters/:characterId/sync')
export class SyncCharacterController {
  constructor(
    private charactersService: CharactersService,
    private powersService: PowersService,
  ) {}

  @Patch()
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(syncCharacterBodySchema)) body: SyncCharacterBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.sync(characterId, user.sub, body);

      const peculiarities = await this.powersService.fetchUserPeculiarities(
        character.userId.toString(),
        1,
      );

      return CharacterPresenter.toHTTP(character, peculiarities);
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
