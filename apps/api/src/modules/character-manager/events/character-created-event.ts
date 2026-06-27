import { Character } from '@aetherium/rules-engine';

export class CharacterCreatedEvent {
  public ocurredAt: Date;
  public character: Character;

  constructor(character: Character) {
    this.character = character;
    this.ocurredAt = new Date();
  }
}
