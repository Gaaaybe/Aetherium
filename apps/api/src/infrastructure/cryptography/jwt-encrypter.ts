import { Injectable } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Encrypter } from '@/domain/accounts/application/cryptography/encrypter';

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(private jwtService: JwtService) {}

  encrypt(payload: Record<string, unknown>): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
