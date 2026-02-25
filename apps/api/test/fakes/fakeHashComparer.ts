import { HashComparer } from '@/domain/accounts/application/cryptography/hash-comparer';

export class FakeHashComparer extends HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed_${plain}`;
  }
}
