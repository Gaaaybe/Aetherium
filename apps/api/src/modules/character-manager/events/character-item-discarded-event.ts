import { Character } from '@aetherium/rules-engine';

export class CharacterItemDiscardedEvent {
  public ocurredAt: Date;
  public character: Character;
  public discardedItemId: string;

  constructor(character: Character, discardedItemId: string) {
    this.character = character;
    this.discardedItemId = discardedItemId;
    this.ocurredAt = new Date();
  }
}
