import { Character } from '@aetherium/rules-engine';

export class CharacterPowerDiscardedEvent {
  public ocurredAt: Date;
  public character: Character;
  public discardedPowerId: string;

  constructor(character: Character, discardedPowerId: string) {
    this.character = character;
    this.discardedPowerId = discardedPowerId;
    this.ocurredAt = new Date();
  }
}
