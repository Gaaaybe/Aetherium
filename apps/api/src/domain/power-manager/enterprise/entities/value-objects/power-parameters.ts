
export type ActionType = 0 | 1 | 2 | 3 | 4 | 5;

export type RangeType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DurationType = 0 | 1 | 2 | 3 | 4;

interface PowerParametersProps {
  acao: ActionType;
  alcance: RangeType;
  duracao: DurationType;
}

export class PowerParameters {
  private readonly props: PowerParametersProps;

  private constructor(props: PowerParametersProps) {
    this.props = props;
  }

  get acao(): ActionType {
    return this.props.acao;
  }

  get alcance(): RangeType {
    return this.props.alcance;
  }

  get duracao(): DurationType {
    return this.props.duracao;
  }

  isPermanente(): boolean {
    return this.props.duracao === 4;
  }

  isPessoal(): boolean {
    return this.props.alcance === 0;
  }

  isInstantaneo(): boolean {
    return this.props.duracao === 0;
  }

  private static validate(props: PowerParametersProps): void {
    if (props.acao < 0 || props.acao > 5) {
      throw new Error('Ação deve estar entre 0 e 5');
    }

    if (props.alcance < 0 || props.alcance > 6) {
      throw new Error('Alcance deve estar entre 0 e 6');
    }

    if (props.duracao < 0 || props.duracao > 4) {
      throw new Error('Duração deve estar entre 0 e 4');
    }
  }

  static create(props: PowerParametersProps): PowerParameters {
    this.validate(props);
    return new PowerParameters(props);
  }

  static createDefault(): PowerParameters {
    return new PowerParameters({
      acao: 2,
      alcance: 1, 
      duracao: 0,
    });
  }


  equals(other: PowerParameters): boolean {
    if (!other) return false;

    return (
      this.props.acao === other.props.acao &&
      this.props.alcance === other.props.alcance &&
      this.props.duracao === other.props.duracao
    );
  }

  toValue(): PowerParametersProps {
    return {
      acao: this.props.acao,
      alcance: this.props.alcance,
      duracao: this.props.duracao,
    };
  }
}