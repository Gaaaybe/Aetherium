import { DomainValidationError } from '@/core/errors/domain-validation-error';
import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';

export enum ModificationType {
  EXTRA = 'extra',
  FALHA = 'falha',
}

export enum ModificationConfigurationType {
  SELECT = 'select',
  RADIO = 'radio',
}

export enum ModificationParameterType {
  TEXT = 'texto',
  GRAU = 'grau',
  SELECT = 'select',
}

export interface ModificationConfigurationOption {
  id: string;
  nome: string;
  modificadorCusto?: number;
  modificadorCustoFixo?: number;
  descricao: string;
}

export interface ModificationConfiguration {
  tipo: ModificationConfigurationType;
  label: string;
  opcoes: ModificationConfigurationOption[];
}

interface ModificationBaseProps {
  id: string;
  nome: string;
  tipo: ModificationType;
  custoFixo: number;
  custoPorGrau: number;
  descricao: string;
  requerParametros?: boolean;
  tipoParametro?: ModificationParameterType;
  opcoes?: string[];
  grauMinimo?: number;
  grauMaximo?: number;
  placeholder?: string;
  categoria: string;
  observacoes?: string;
  detalhesGrau?: string;
  configuracoes?: ModificationConfiguration;
  custom?: boolean;
}

export class ModificationBase extends Entity<ModificationBaseProps> {
  get modificationId(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get tipo(): ModificationType {
    return this.props.tipo;
  }

  get custoFixo(): number {
    return this.props.custoFixo;
  }

  get custoPorGrau(): number {
    return this.props.custoPorGrau;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get requerParametros(): boolean {
    return this.props.requerParametros ?? false;
  }

  get tipoParametro(): ModificationParameterType | undefined {
    return this.props.tipoParametro;
  }

  get opcoes(): string[] | undefined {
    return this.props.opcoes ? [...this.props.opcoes] : undefined;
  }

  get grauMinimo(): number | undefined {
    return this.props.grauMinimo;
  }

  get grauMaximo(): number | undefined {
    return this.props.grauMaximo;
  }

  get placeholder(): string | undefined {
    return this.props.placeholder;
  }

  get categoria(): string {
    return this.props.categoria;
  }

  get observacoes(): string | undefined {
    return this.props.observacoes;
  }

  get detalhesGrau(): string | undefined {
    return this.props.detalhesGrau;
  }

  get configuracoes(): ModificationConfiguration | undefined {
    return this.props.configuracoes;
  }

  get custom(): boolean {
    return this.props.custom ?? false;
  }

  isExtra(): boolean {
    return this.props.tipo === ModificationType.EXTRA;
  }

  isFalha(): boolean {
    return this.props.tipo === ModificationType.FALHA;
  }

  hasConfiguracoes(): boolean {
    return !!this.props.configuracoes && this.props.configuracoes.opcoes.length > 0;
  }

  isCustom(): boolean {
    return this.props.custom === true;
  }

  getConfiguracao(configuracaoId: string): ModificationConfigurationOption | undefined {
    if (!this.props.configuracoes) return undefined;
    return this.props.configuracoes.opcoes.find((opt) => opt.id === configuracaoId);
  }

  calcularCustoComConfiguracao(configuracaoId?: string): {
    custoFixo: number;
    custoPorGrau: number;
  } {
    let custoFixo = this.props.custoFixo;
    let custoPorGrau = this.props.custoPorGrau;

    if (configuracaoId && this.props.configuracoes) {
      const config = this.getConfiguracao(configuracaoId);
      if (config) {
        if (config.modificadorCustoFixo !== undefined) {
          custoFixo += config.modificadorCustoFixo;
        }
        if (config.modificadorCusto !== undefined) {
          custoPorGrau += config.modificadorCusto;
        }
      }
    }

    return { custoFixo, custoPorGrau };
  }

  hasCost(): boolean {
    return this.props.custoFixo !== 0 || this.props.custoPorGrau !== 0;
  }

  private static validate(props: ModificationBaseProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new DomainValidationError('ID da modificação é obrigatório', 'id');
    }

    if (!props.nome || props.nome.trim() === '') {
      throw new DomainValidationError('Nome da modificação é obrigatório', 'nome');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new DomainValidationError('Descrição da modificação é obrigatória', 'descricao');
    }

    if (!props.categoria || props.categoria.trim() === '') {
      throw new DomainValidationError('Categoria da modificação é obrigatória', 'categoria');
    }

    if (props.tipo === ModificationType.EXTRA) {
      if (props.custoFixo < 0 || props.custoPorGrau < 0) {
        throw new DomainValidationError('Extra não pode ter custo negativo', 'custoFixo');
      }
    } else if (props.tipo === ModificationType.FALHA) {
      if (props.custoFixo > 0 || props.custoPorGrau > 0) {
        throw new DomainValidationError('Falha não pode ter custo positivo', 'custoFixo');
      }
    }
    if (Math.abs(props.custoFixo) > 50) {
      throw new DomainValidationError('Custo fixo absoluto não pode exceder 50', 'custoFixo');
    }

    if (Math.abs(props.custoPorGrau) > 20) {
      throw new DomainValidationError('Custo por grau absoluto não pode exceder 20', 'custoPorGrau');
    }

    if (props.requerParametros) {
      if (!props.tipoParametro) {
        throw new DomainValidationError('Modificação que requer parâmetros deve especificar o tipo', 'tipoParametro');
      }

      if (
        props.tipoParametro === ModificationParameterType.GRAU &&
        (props.grauMinimo === undefined || props.grauMaximo === undefined)
      ) {
        throw new DomainValidationError(
          'Modificação com tipoParametro "grau" deve especificar grauMinimo e grauMaximo',
          'tipoParametro',
        );
      }
    }

    if (props.tipoParametro === ModificationParameterType.SELECT) {
      if (!props.configuracoes && (!props.opcoes || props.opcoes.length === 0)) {
        throw new DomainValidationError(
          'Modificação com tipoParametro "select" deve especificar configurações ou opções simples',
          'tipoParametro',
        );
      }
    }

    if (props.grauMinimo !== undefined && props.grauMaximo !== undefined) {
      if (props.grauMinimo > props.grauMaximo) {
        throw new DomainValidationError('grauMinimo não pode ser maior que grauMaximo', 'grauMinimo');
      }

      if (props.grauMinimo < 0 || props.grauMaximo < 0) {
        throw new DomainValidationError('grauMinimo e grauMaximo devem ser não-negativos', 'grauMinimo');
      }
    }

    if (props.configuracoes) {
      if (props.configuracoes.opcoes.length === 0) {
        throw new DomainValidationError('Configurações devem ter pelo menos uma opção', 'configuracoes');
      }

      for (const opcao of props.configuracoes.opcoes) {
        if (!opcao.id || opcao.id.trim() === '') {
          throw new DomainValidationError('ID da configuração é obrigatório', 'configuracoes');
        }
        if (!opcao.nome || opcao.nome.trim() === '') {
          throw new DomainValidationError('Nome da configuração é obrigatório', 'configuracoes');
        }
      }
    }
  }

  static create(
    props: Optional<ModificationBaseProps, 'custom'>,
    id?: UniqueEntityId,
  ): ModificationBase {
    ModificationBase.validate(props as ModificationBaseProps);

    const modificationBase = new ModificationBase(
      {
        ...props,
        custom: props.custom ?? false,
      },
      id,
    );

    return modificationBase;
  }

  static createCustom(
    props: Omit<ModificationBaseProps, 'custom'>,
    id?: UniqueEntityId,
  ): ModificationBase {
    return ModificationBase.create(
      {
        ...props,
        custom: true,
      },
      id,
    );
  }
}
