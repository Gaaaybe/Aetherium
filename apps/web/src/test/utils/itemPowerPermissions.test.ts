import { describe, expect, test } from 'vitest';
import { canEditItemPower } from '@/features/criador-de-item/utils/itemPowerPermissions';

describe('canEditItemPower', () => {
  test('permite ao proprietário do item', () => {
    expect(canEditItemPower({ currentUserId: 'user-1', itemUserId: 'user-1' })).toBe(true);
  });

  test('permite ao proprietário da cópia interna do poder', () => {
    expect(canEditItemPower({
      currentUserId: 'user-1',
      itemUserId: null,
      powerUserId: 'user-1',
    })).toBe(true);
  });

  test('permite administradores', () => {
    expect(canEditItemPower({ currentUserId: 'admin-1', isAdmin: true })).toBe(true);
  });

  test('nega usuários sem vínculo de propriedade', () => {
    expect(canEditItemPower({
      currentUserId: 'user-2',
      itemUserId: 'user-1',
      powerUserId: 'user-1',
    })).toBe(false);
  });
});
