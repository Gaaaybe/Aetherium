import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';

const createCharacterBodySchema = z.object({
  narrative: z
    .object({
      name: z.string().optional(),
      identity: z.string().optional(),
      origin: z.string().min(1),
      motivations: z.array(z.string().min(1)),
      complications: z.array(z.string().min(1)),
    })
    .refine(
      (value) => value.motivations.length + value.complications.length >= 2,
      'O personagem deve ter pelo menos duas entradas entre motivações e complicações',
    ),
  attributes: z.object({
    strength: z.number().int().min(0),
    dexterity: z.number().int().min(0),
    constitution: z.number().int().min(0),
    intelligence: z.number().int().min(0),
    wisdom: z.number().int().min(0),
    charisma: z.number().int().min(0),
    keyPhysical: z.enum(['strength', 'dexterity', 'constitution']),
    keyMental: z.enum(['intelligence', 'wisdom', 'charisma']),
  }),
  spiritualPrinciple: z.object({
    isUnlocked: z.boolean(),
  }),
});

type CreateCharacterBodySchema = z.infer<typeof createCharacterBodySchema>;

@Controller('/characters')
export class CreateCharacterController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createCharacterBodySchema)) body: CreateCharacterBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const character = await this.charactersService.create(user.sub, body);
    return CharacterPresenter.toHTTP(character);
  }
}
