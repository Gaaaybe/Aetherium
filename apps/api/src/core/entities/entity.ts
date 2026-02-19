import { UniqueEntityId } from './unique-entity-ts';

export abstract class Entity<Props> {
  private _id: UniqueEntityId;
  protected props: Props;

  get id() {
    return this._id;
  }

  protected constructor(props: Props, id?: UniqueEntityId) {
    this._id = id ?? new UniqueEntityId();
    this.props = props;
  }

  public equals(entity: Entity<unknown>) {
    return entity === this || entity._id === this.id;
  }
}
