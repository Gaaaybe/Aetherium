export abstract class Encrypter {
  abstract encrypt(payload: Record<string, any>): Promise<string>;
}

export abstract class HashGenerator {
  abstract hash(plain: string): Promise<string>;
}

export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>;
}
