import type { HashComparer } from '../../cryptography/hash-comparer';

export class FakeHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed_${plain}`;
  }
}
