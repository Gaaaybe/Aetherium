import { ItemType } from '@aetherium/rules-engine';
import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { Public } from '@/infrastructure/auth/public';
import { ZodValidationPipe } from '@/infrastructure/http/pipes/zod-validation-pipe';
import type {
  CreateItemBodySchema,
  ImportItemBodySchema,
  UpdateItemBodySchema,
} from './dto/item.dto';
import {
  createItemBodySchema,
  formatItemToHTTP,
  importItemBodySchema,
  updateItemBodySchema,
} from './dto/item.dto';
import { ItemsService } from './items.service';

const VALID_TYPES = Object.values(ItemType) as string[];

@Controller()
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post('/items')
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(createItemBodySchema)) body: CreateItemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.itemsService.create(user.sub, body);
    return formatItemToHTTP(raw);
  }

  @Put('/items/:itemId')
  async update(
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateItemBodySchema)) body: UpdateItemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.itemsService.update(itemId, user.sub, body, user.isAdmin);
    return formatItemToHTTP(raw);
  }

  @Delete('/items/:itemId')
  @HttpCode(204)
  async delete(@Param('itemId') itemId: string, @CurrentUser() user: UserPayload) {
    await this.itemsService.delete(itemId, user.sub, user.isAdmin);
  }

  @Post('/items/:itemId/copy')
  @HttpCode(201)
  async copyPublic(@Param('itemId') itemId: string, @CurrentUser() user: UserPayload) {
    const raw = await this.itemsService.copyPublic(itemId, user.sub);
    return formatItemToHTTP(raw);
  }

  @Get('/items')
  @Public()
  async fetchPublic(@Query('page') page: string, @Query('tipo') tipo: string) {
    const pageNum = page ? Number(page) : 1;
    const tipoFilter = VALID_TYPES.includes(tipo) ? (tipo as ItemType) : undefined;
    const raws = await this.itemsService.fetchPublic(pageNum, tipoFilter);
    return raws.map(formatItemToHTTP);
  }

  @Get('/items/me')
  async fetchUser(
    @Query('page') page: string,
    @Query('tipo') tipo: string,
    @CurrentUser() user: UserPayload,
  ) {
    const pageNum = page ? Number(page) : 1;
    const tipoFilter = VALID_TYPES.includes(tipo) ? (tipo as ItemType) : undefined;
    const raws = await this.itemsService.fetchUser(user.sub, pageNum, tipoFilter);
    return raws.map(formatItemToHTTP);
  }

  @Get('/items/:itemId')
  async getById(@Param('itemId') itemId: string) {
    const raw = await this.itemsService.getById(itemId);
    return formatItemToHTTP(raw);
  }

  @Get('/characters/:characterId/items')
  async fetchCharacter(@Param('characterId') characterId: string) {
    const raws = await this.itemsService.fetchCharacter(characterId);
    return {
      items: raws.map(formatItemToHTTP),
    };
  }

  @Get('/items/:itemId/export')
  async exportItem(@Param('itemId') itemId: string, @CurrentUser() user: UserPayload) {
    return this.itemsService.exportItem(itemId, user.sub, user.isAdmin);
  }

  @Post('/items/import')
  @HttpCode(201)
  async importItem(
    @Body(new ZodValidationPipe(importItemBodySchema)) body: ImportItemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.itemsService.importItem(user.sub, body);
    return formatItemToHTTP(raw);
  }

  @Get('/admin/items')
  async fetchAllAdminItems(@CurrentUser() user: UserPayload) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Acesso negado');
    }
    const raws = await this.itemsService.fetchAllItems();
    return raws.map(formatItemToHTTP);
  }

  @Patch('/admin/items/:itemId/promote')
  async promoteItem(@Param('itemId') itemId: string, @CurrentUser() user: UserPayload) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Acesso negado');
    }
    const raw = await this.itemsService.promoteItem(itemId);
    return formatItemToHTTP(raw);
  }
}
