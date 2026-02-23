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
      throw new Error('ID da modificação é obrigatório');
    }

    if (!props.nome || props.nome.trim() === '') {
      throw new Error('Nome da modificação é obrigatório');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new Error('Descrição da modificação é obrigatória');
    }

    if (!props.categoria || props.categoria.trim() === '') {
      throw new Error('Categoria da modificação é obrigatória');
    }

    if (props.tipo === ModificationType.EXTRA) {
      if (props.custoFixo < 0 || props.custoPorGrau < 0) {
        throw new Error('Extra não pode ter custo negativo');
      }
    } else if (props.tipo === ModificationType.FALHA) {
      if (props.custoFixo > 0 || props.custoPorGrau > 0) {
        throw new Error('Falha não pode ter custo positivo');
      }
    }
    if (Math.abs(props.custoFixo) > 50) {
      throw new Error('Custo fixo absoluto não pode exceder 50');
    }

    if (Math.abs(props.custoPorGrau) > 20) {
      throw new Error('Custo por grau absoluto não pode exceder 20');
    }

    if (props.requerParametros) {
      if (!props.tipoParametro) {
        throw new Error('Modificação que requer parâmetros deve especificar o tipo');
      }

      if (
        props.tipoParametro === ModificationParameterType.GRAU &&
        (props.grauMinimo === undefined || props.grauMaximo === undefined)
      ) {
        throw new Error(
          'Modificação com tipoParametro "grau" deve especificar grauMinimo e grauMaximo',
        );
      }
    }

    if (props.tipoParametro === ModificationParameterType.SELECT) {
      if (!props.configuracoes && (!props.opcoes || props.opcoes.length === 0)) {
        throw new Error(
          'Modificação com tipoParametro "select" deve especificar configurações ou opções simples',
        );
      }
    }

    if (props.grauMinimo !== undefined && props.grauMaximo !== undefined) {
      if (props.grauMinimo > props.grauMaximo) {
        throw new Error('grauMinimo não pode ser maior que grauMaximo');
      }

      if (props.grauMinimo < 0 || props.grauMaximo < 0) {
        throw new Error('grauMinimo e grauMaximo devem ser não-negativos');
      }
    }

    if (props.configuracoes) {
      if (props.configuracoes.opcoes.length === 0) {
        throw new Error('Configurações devem ter pelo menos uma opção');
      }

      for (const opcao of props.configuracoes.opcoes) {
        if (!opcao.id || opcao.id.trim() === '') {
          throw new Error('ID da configuração é obrigatório');
        }
        if (!opcao.nome || opcao.nome.trim() === '') {
          throw new Error('Nome da configuração é obrigatório');
        }
      }
    }
  }

  static create(
    props: Optional<ModificationBaseProps, 'custom'>,
    id?: UniqueEntityId,
  ): ModificationBase {
    this.validate(props as ModificationBaseProps);

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
