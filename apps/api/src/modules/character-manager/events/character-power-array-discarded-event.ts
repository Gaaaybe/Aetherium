import { Character } from '@aetherium/rules-engine';

export class CharacterPowerArrayDiscardedEvent {
  public ocurredAt: Date;
  public character: Character;
  public discardedPowerArrayId: string;

  constructor(character: Character, discardedPowerArrayId: string) {
    this.character = character;
    this.discardedPowerArrayId = discardedPowerArrayId;
    this.ocurredAt = new Date();
  }
}
