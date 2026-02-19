import { describe, expect, it } from 'vitest';
import { type Either, left, right } from './either';

function doSomething(shouldSuccess: boolean): Either<string, string> {
  return shouldSuccess ? right('success') : left('error');
}

describe('Either', () => {
  it('should return right result on success', () => {
    const successResult = doSomething(true);

    expect(successResult.isLeft()).toBe(false);
    expect(successResult.isRight()).toBe(true);
  });

  it('should return left result on error', () => {
    const errorResult = doSomething(false);

    expect(errorResult.isLeft()).toBe(true);
    expect(errorResult.isRight()).toBe(false);
  });
});
