import { Module } from '@nestjs/common';
import { BcryptHasher } from './bcrypt-hasher';
import { Encrypter, HashComparer, HashGenerator } from './cryptography';
import { JwtEncrypter } from './jwt-encrypter';

@Module({
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashGenerator, useClass: BcryptHasher },
    { provide: HashComparer, useClass: BcryptHasher },
  ],
  exports: [HashGenerator, HashComparer, Encrypter],
})
export class CryptographyModule {}
