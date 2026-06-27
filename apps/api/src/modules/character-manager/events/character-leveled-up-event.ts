import { Character } from '@aetherium/rules-engine';

export class CharacterLeveledUpEvent {
  public ocurredAt: Date;
  public character: Character;
  public newLevel: number;

  constructor(character: Character, newLevel: number) {
    this.character = character;
    this.newLevel = newLevel;
    this.ocurredAt = new Date();
  }
}
