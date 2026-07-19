import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
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

const colors = ['indigo', 'blue', 'emerald', 'amber', 'rose', 'violet'] as const;
const styleSchema = z.enum(['BAR', 'DOTS', 'COUNTER']);

const resourceFields = {
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).nullable().optional(),
  style: styleSchema,
  color: z.enum(colors),
  current: z.number().int().min(-999999).max(999999),
  minimum: z.number().int().min(-999999).max(999999),
  maximum: z.number().int().min(-999999).max(999999).nullable().optional(),
  step: z.number().int().min(1).max(999999),
};

const createSchema = z.object(resourceFields).superRefine((data, context) => {
  if ((data.style === 'BAR' || data.style === 'DOTS') && data.maximum == null) {
    context.addIssue({ code: 'custom', path: ['maximum'], message: 'Este estilo exige um máximo' });
  }
  if (data.maximum != null && data.maximum < data.minimum) {
    context.addIssue({ code: 'custom', path: ['maximum'], message: 'O máximo deve ser maior ou igual ao mínimo' });
  }
  if (data.style === 'DOTS' && data.maximum != null && data.maximum - data.minimum > 30) {
    context.addIssue({ code: 'custom', path: ['maximum'], message: 'Pontos permitem no máximo 30 posições' });
  }
});

const updateSchema = z.object({
  name: resourceFields.name.optional(),
  description: resourceFields.description,
  style: resourceFields.style.optional(),
  color: resourceFields.color.optional(),
  current: resourceFields.current.optional(),
  minimum: resourceFields.minimum.optional(),
  maximum: resourceFields.maximum,
  step: resourceFields.step.optional(),
});
const adjustSchema = z.object({ delta: z.number().int().min(-999999).max(999999) });
const reorderSchema = z.object({ resourceIds: z.array(z.string().uuid()).max(50) });

function presentResources(character: any) {
  return {
    customResources: (character.customResources || []).map((resource: any) => ({
      id: resource.id,
      name: resource.name,
      description: resource.description ?? null,
      style: resource.style,
      color: resource.color,
      current: resource.current,
      minimum: resource.minimum,
      maximum: resource.maximum ?? null,
      step: resource.step,
      position: resource.position,
    })),
  };
}

@Controller('/characters/:characterId/resources')
export class CustomResourcesController {
  constructor(private charactersService: CharactersService) {}

  private async execute(operation: () => Promise<any>) {
    try {
      return presentResources(await operation());
    } catch (error: any) {
      if (error instanceof ResourceNotFoundError || error?.constructor?.name === 'ResourceNotFoundError') {
        throw new NotFoundException(error.message);
      }
      if (error instanceof NotAllowedError || error?.constructor?.name === 'NotAllowedError') {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof DomainValidationError || error?.constructor?.name === 'DomainValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post()
  create(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>,
    @CurrentUser() user: UserPayload,
  ) {
    return this.execute(() => this.charactersService.createCustomResource(characterId, user.sub, body));
  }

  @Patch('order')
  reorder(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(reorderSchema)) body: z.infer<typeof reorderSchema>,
    @CurrentUser() user: UserPayload,
  ) {
    return this.execute(() => this.charactersService.reorderCustomResources(characterId, user.sub, body.resourceIds));
  }

  @Patch(':resourceId/value')
  adjust(
    @Param('characterId') characterId: string,
    @Param('resourceId') resourceId: string,
    @Body(new ZodValidationPipe(adjustSchema)) body: z.infer<typeof adjustSchema>,
    @CurrentUser() user: UserPayload,
  ) {
    return this.execute(() => this.charactersService.adjustCustomResource(characterId, user.sub, resourceId, body.delta));
  }

  @Patch(':resourceId')
  update(
    @Param('characterId') characterId: string,
    @Param('resourceId') resourceId: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>,
    @CurrentUser() user: UserPayload,
  ) {
    return this.execute(() => this.charactersService.updateCustomResource(characterId, user.sub, resourceId, body));
  }

  @Delete(':resourceId')
  remove(
    @Param('characterId') characterId: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.execute(() => this.charactersService.deleteCustomResource(characterId, user.sub, resourceId));
  }
}
