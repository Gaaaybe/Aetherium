
export enum AlternativeCostType {
  PE = 'pe',
  PV = 'pv',
  ATRIBUTO = 'atributo',
  ITEM = 'item',
  MATERIAL = 'material',
}

interface AlternativeCostProps {
  tipo: AlternativeCostType;
  quantidade: number;
  descricao?: string;
  atributo?: string; 
  itemId?: string;
}

export class AlternativeCost {
  private readonly props: AlternativeCostProps;

  private constructor(props: AlternativeCostProps) {
    this.props = props;
  }

  get tipo(): AlternativeCostType {
    return this.props.tipo;
  }

  get quantidade(): number {
    return this.props.quantidade;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get atributo(): string | undefined {
    return this.props.atributo;
  }

  get itemId(): string | undefined {
    return this.props.itemId;
  }

  isVitalResource(): boolean {
    return this.props.tipo === AlternativeCostType.PE || this.props.tipo === AlternativeCostType.PV;
  }

  isAttributeCost(): boolean {
    return this.props.tipo === AlternativeCostType.ATRIBUTO;
  }

  isItemConsumption(): boolean {
    return this.props.tipo === AlternativeCostType.ITEM;
  }

  private static validate(props: AlternativeCostProps): void {
    if (props.quantidade <= 0) {
      throw new Error('Quantidade de custo alternativo deve ser positiva');
    }

    if (props.tipo === AlternativeCostType.ATRIBUTO && !props.atributo) {
      throw new Error('Custo de atributo requer o nome do atributo');
    }

    if (props.tipo === AlternativeCostType.ITEM && !props.itemId) {
      throw new Error('Custo de item requer o ID do item');
    }

    if (props.tipo === AlternativeCostType.MATERIAL && !props.descricao) {
      throw new Error('Custo de material requer descrição');
    }
  }

  static create(props: AlternativeCostProps): AlternativeCost {
    this.validate(props);
    return new AlternativeCost(props);
  }


  static createPE(quantidade: number, descricao?: string): AlternativeCost {
    return AlternativeCost.create({
      tipo: AlternativeCostType.PE,
      quantidade,
      descricao,
    });
  }

  static createPV(quantidade: number, descricao?: string): AlternativeCost {
    return AlternativeCost.create({
      tipo: AlternativeCostType.PV,
      quantidade,
      descricao,
    });
  }

  static createAtributo(
    atributo: string,
    quantidade: number,
    descricao?: string,
  ): AlternativeCost {
    return AlternativeCost.create({
      tipo: AlternativeCostType.ATRIBUTO,
      quantidade,
      descricao,
      atributo,
    });
  }

  static createItem(itemId: string, quantidade: number, descricao?: string): AlternativeCost {
    return AlternativeCost.create({
      tipo: AlternativeCostType.ITEM,
      quantidade,
      descricao,
      itemId,
    });
  }


  static createMaterial(descricao: string, quantidade: number): AlternativeCost {
    return AlternativeCost.create({
      tipo: AlternativeCostType.MATERIAL,
      quantidade,
      descricao,
    });
  }

  equals(other: AlternativeCost): boolean {
    if (!other) return false;

    return (
      this.props.tipo === other.props.tipo &&
      this.props.quantidade === other.props.quantidade &&
      this.props.descricao === other.props.descricao &&
      this.props.atributo === other.props.atributo &&
      this.props.itemId === other.props.itemId
    );
  }

  toValue(): AlternativeCostProps {
    return {
      tipo: this.props.tipo,
      quantidade: this.props.quantidade,
      descricao: this.props.descricao,
      atributo: this.props.atributo,
      itemId: this.props.itemId,
    };
  }
}