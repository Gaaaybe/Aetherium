interface ItemPowerPermissionInput {
  currentUserId?: string | null;
  isAdmin?: boolean;
  itemUserId?: string | null;
  powerUserId?: string | null;
}

export function canEditItemPower({
  currentUserId,
  isAdmin,
  itemUserId,
  powerUserId,
}: ItemPowerPermissionInput): boolean {
  if (!currentUserId) return false;
  return isAdmin === true || itemUserId === currentUserId || powerUserId === currentUserId;
}
