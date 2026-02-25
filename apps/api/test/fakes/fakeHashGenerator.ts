import { HashGenerator } from '@/domain/accounts/application/cryptography/hash-generator';

export class FakeHashGenerator extends HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`;
  }
}
