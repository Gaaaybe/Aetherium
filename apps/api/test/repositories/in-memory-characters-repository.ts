import { CharactersRepository } from '@/domain/character-manager/application/repositories/characters-repository';
import { Character } from '@/domain/character-manager/enterprise/entities/character';

export class InMemoryCharactersRepository extends CharactersRepository {
  public items: Character[] = [];

  async create(character: Character): Promise<void> {
    this.items.push(character);
  }

  async save(character: Character): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(character.id));

    this.items[itemIndex] = character;
  }

  async findById(id: string): Promise<Character | null> {
    const character = this.items.find((item) => item.id.toString() === id);

    if (!character) {
      return null;
    }

    return character;
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const characters = this.items.filter((item) => item.userId.toString() === userId);

    return characters;
  }

  async findMany(): Promise<Character[]> {
    return this.items;
  }

  async delete(character: Character): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(character.id));

    this.items.splice(itemIndex, 1);
  }
}
