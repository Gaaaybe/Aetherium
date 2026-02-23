
export enum DomainName {

  NATURAL = 'natural',
  SAGRADO = 'sagrado',
  SACRILEGIO = 'sacrilegio',
  PSIQUICO = 'psiquico',

  CIENTIFICO = 'cientifico',
  PECULIAR = 'peculiar',

  ARMA_BRANCA = 'arma-branca',
  ARMA_FOGO = 'arma-fogo',
  ARMA_TENSAO = 'arma-tensao',
  ARMA_EXPLOSIVA = 'arma-explosiva',
  ARMA_TECNOLOGICA = 'arma-tecnologica',
}

interface DomainProps {
  name: DomainName;
  areaConhecimento?: string;
  peculiarId?: string;
}

export class Domain {
  private readonly props: DomainProps;

  private constructor(props: DomainProps) {
    this.props = props;
  }

  get name(): DomainName {
    return this.props.name;
  }

  get areaConhecimento(): string | undefined {
    return this.props.areaConhecimento;
  }

  get peculiarId(): string | undefined {
    return this.props.peculiarId;
  }

  isCientifico(): boolean {
    return this.props.name === DomainName.CIENTIFICO;
  }

  isPeculiar(): boolean {
    return this.props.name === DomainName.PECULIAR;
  }

  isArma(): boolean {
    return (
      this.props.name === DomainName.ARMA_BRANCA ||
      this.props.name === DomainName.ARMA_FOGO ||
      this.props.name === DomainName.ARMA_TENSAO ||
      this.props.name === DomainName.ARMA_EXPLOSIVA ||
      this.props.name === DomainName.ARMA_TECNOLOGICA
    );
  }

  isEspiritual(): boolean {
    return (
      this.props.name === DomainName.NATURAL ||
      this.props.name === DomainName.SAGRADO ||
      this.props.name === DomainName.SACRILEGIO ||
      this.props.name === DomainName.PSIQUICO
    );
  }

  private static validate(props: DomainProps): void {
    if (props.name === DomainName.CIENTIFICO && !props.areaConhecimento) {
      throw new Error('Domínio Científico requer área de conhecimento');
    }

    if (props.name === DomainName.PECULIAR && !props.peculiarId) {
      throw new Error('Domínio Peculiar requer ID da peculiaridade');
    }

    if (
      props.name !== DomainName.CIENTIFICO &&
      props.name !== DomainName.PECULIAR &&
      (props.areaConhecimento || props.peculiarId)
    ) {
      throw new Error('Apenas domínios Científico e Peculiar podem ter campos específicos');
    }
  }

  static create(props: DomainProps): Domain {
    this.validate(props);
    return new Domain(props);
  }

  equals(other: Domain): boolean {
    if (!other) return false;

    return (
      this.props.name === other.props.name &&
      this.props.areaConhecimento === other.props.areaConhecimento &&
      this.props.peculiarId === other.props.peculiarId
    );
  }

  toValue(): DomainProps {
    return {
      name: this.props.name,
      areaConhecimento: this.props.areaConhecimento,
      peculiarId: this.props.peculiarId,
    };
  }
}