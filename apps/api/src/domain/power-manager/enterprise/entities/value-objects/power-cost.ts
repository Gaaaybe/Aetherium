import { DomainValidationError } from '@/core/errors/domain-validation-error';

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
      throw new DomainValidationError('Custo de PdA não pode ser negativo', 'pda');
    }

    if (props.pe < 0) {
      throw new DomainValidationError('Custo de PE não pode ser negativo', 'pe');
    }

    if (props.espacos < 0) {
      throw new DomainValidationError('Espaços não podem ser negativos', 'espacos');
    }

    if (props.pda > 99999) {
      throw new DomainValidationError('Custo de PdA excede limite máximo (99999)', 'pda');
    }

    if (props.pe > 999) {
      throw new DomainValidationError('Custo de PE excede limite máximo (999)', 'pe');
    }

    if (props.espacos > 999) {
      throw new DomainValidationError('Espaços excedem limite máximo (999)', 'espacos');
    }
  }

  static create(props: PowerCostProps): PowerCost {
    PowerCost.validate(props);
    return new PowerCost(props);
  }

  static createZero(): PowerCost {
    return new PowerCost({
      pda: 0,
      pe: 0,
      espacos: 0,
    });
  }

  static sum(costs: PowerCost[]): PowerCost {
    let totalPdA = 0;
    let totalPE = 0;
    let totalEspacos = 0;

    for (const cost of costs) {
      totalPdA += cost.pda;
      totalPE += cost.pe;
      totalEspacos += cost.espacos;
    }

    return PowerCost.create({
      pda: totalPdA,
      pe: totalPE,
      espacos: totalEspacos,
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
      throw new DomainValidationError('Fator de multiplicação não pode ser negativo', 'factor');
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
