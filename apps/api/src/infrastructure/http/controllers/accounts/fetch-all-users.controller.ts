import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { AccountsService } from '@/modules/accounts/accounts.service';

@Controller('/admin/users')
export class FetchAllUsersController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Acesso não autorizado para esta operação');
    }
    return this.accountsService.fetchAllUsers();
  }
}
