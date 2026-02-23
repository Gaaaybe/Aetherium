
interface PowerCostProps {
  pda: number;
  pe: number;
  espacos: number;
}

export class PowerCost {
  private readonly props: PowerCostProps;

  private constructor(props: PowerCostProps) {
    this.props = props;
  }

  get pda(): number {
    return this.props.pda;
  }

  get pe(): number {
    return this.props.pe;
  }

  get espacos(): number {
    return this.props.espacos;
  }

  isFree(): boolean {
    return this.props.pda === 0;
  }

  requiresPE(): boolean {
    return this.props.pe > 0;
  }

  requiresEspacos(): boolean {
    return this.props.espacos > 0;
  }

  private static validate(props: PowerCostProps): void {
    if (props.pda < 0) {
      throw new Error('Custo de PdA não pode ser negativo');
    }

    if (props.pe < 0) {
      throw new Error('Custo de PE não pode ser negativo');
    }

    if (props.espacos < 0) {
      throw new Error('Espaços não podem ser negativos');
    }
    
    if (props.pda > 99999) {
      throw new Error('Custo de PdA excede limite máximo (99999)');
    }

    if (props.pe > 999) {
      throw new Error('Custo de PE excede limite máximo (999)');
    }

    if (props.espacos > 999) {
      throw new Error('Espaços excedem limite máximo (999)');
    }
  }

  static create(props: PowerCostProps): PowerCost {
    this.validate(props);
    return new PowerCost(props);
  }

  static createZero(): PowerCost {
    return new PowerCost({
      pda: 0,
      pe: 0,
      espacos: 0,
    });
  }

  add(other: PowerCost): PowerCost {
    return PowerCost.create({
      pda: this.props.pda + other.props.pda,
      pe: this.props.pe + other.props.pe,
      espacos: this.props.espacos + other.props.espacos,
    });
  }

  subtract(other: PowerCost): PowerCost {
    return PowerCost.create({
      pda: Math.max(0, this.props.pda - other.props.pda),
      pe: Math.max(0, this.props.pe - other.props.pe),
      espacos: Math.max(0, this.props.espacos - other.props.espacos),
    });
  }

  multiply(factor: number): PowerCost {
    if (factor < 0) {
      throw new Error('Fator de multiplicação não pode ser negativo');
    }

    return PowerCost.create({
      pda: Math.round(this.props.pda * factor),
      pe: Math.round(this.props.pe * factor),
      espacos: Math.round(this.props.espacos * factor),
    });
  }

  equals(other: PowerCost): boolean {
    if (!other) return false;

    return (
      this.props.pda === other.props.pda &&
      this.props.pe === other.props.pe &&
      this.props.espacos === other.props.espacos
    );
  }

  toValue(): PowerCostProps {
    return {
      pda: this.props.pda,
      pe: this.props.pe,
      espacos: this.props.espacos,
    };
  }
}
