
export enum ModificationScope {
  GLOBAL = 'global',
  LOCAL = 'local',
}

export enum ModificationType {
  EXTRA = 'extra',
  FALHA = 'falha',
}

interface AppliedModificationProps {
  modificationBaseId: string;
  scope: ModificationScope;
  grau?: number;
  parametros?: Record<string, unknown>;
  nota?: string;
}

export class AppliedModification {
  private readonly props: AppliedModificationProps;

  private constructor(props: AppliedModificationProps) {
    this.props = props;
  }

  get modificationBaseId(): string {
    return this.props.modificationBaseId;
  }

  get scope(): ModificationScope {
    return this.props.scope;
  }

  get grau(): number {
    return this.props.grau ?? 1;
  }

  get parametros(): Record<string, unknown> | undefined {
    return this.props.parametros;
  }

  get nota(): string | undefined {
    return this.props.nota;
  }

  isGlobal(): boolean {
    return this.props.scope === ModificationScope.GLOBAL;
  }

  isLocal(): boolean {
    return this.props.scope === ModificationScope.LOCAL;
  }

  hasParametros(): boolean {
    return !!this.props.parametros && Object.keys(this.props.parametros).length > 0;
  }

  private static validate(props: AppliedModificationProps): void {
    if (!props.modificationBaseId || props.modificationBaseId.trim() === '') {
      throw new Error('ID da modificação base é obrigatório');
    }

    if (props.grau !== undefined && props.grau < 1) {
      throw new Error('Grau da modificação deve ser pelo menos 1');
    }

    if (props.nota && props.nota.length > 500) {
      throw new Error('Nota não pode exceder 500 caracteres');
    }
  }

  static create(props: AppliedModificationProps): AppliedModification {
    this.validate(props);
    return new AppliedModification({
      ...props,
      grau: props.grau ?? 1,
    });
  }

  static createGlobal(
    modificationBaseId: string,
    grau?: number,
    parametros?: Record<string, unknown>,
    nota?: string,
  ): AppliedModification {
    return AppliedModification.create({
      modificationBaseId,
      scope: ModificationScope.GLOBAL,
      grau,
      parametros,
      nota,
    });
  }

  static createLocal(
    modificationBaseId: string,
    grau?: number,
    parametros?: Record<string, unknown>,
    nota?: string,
  ): AppliedModification {
    return AppliedModification.create({
      modificationBaseId,
      scope: ModificationScope.LOCAL,
      grau,
      parametros,
      nota,
    });
  }

  withScope(scope: ModificationScope): AppliedModification {
    return AppliedModification.create({
      ...this.props,
      scope,
    });
  }

  withGrau(grau: number): AppliedModification {
    return AppliedModification.create({
      ...this.props,
      grau,
    });
  }

  withParametros(parametros: Record<string, unknown>): AppliedModification {
    return AppliedModification.create({
      ...this.props,
      parametros,
    });
  }

  equals(other: AppliedModification): boolean {
    if (!other) return false;

    return (
      this.props.modificationBaseId === other.props.modificationBaseId &&
      this.props.scope === other.props.scope &&
      this.grau === other.grau &&
      JSON.stringify(this.props.parametros) === JSON.stringify(other.props.parametros)
    );
  }

  toValue(): AppliedModificationProps {
    return {
      modificationBaseId: this.props.modificationBaseId,
      scope: this.props.scope,
      grau: this.props.grau,
      parametros: this.props.parametros,
      nota: this.props.nota,
    };
  }
}