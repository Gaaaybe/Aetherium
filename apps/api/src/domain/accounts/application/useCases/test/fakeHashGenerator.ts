import type { HashGenerator } from '../../cryptography/hash-generator';

export class FakeHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`;
  }
}
