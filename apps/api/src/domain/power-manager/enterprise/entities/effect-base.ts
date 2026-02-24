import { DomainValidationError } from '@/core/errors/domain-validation-error';
import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';
import { PowerParameters } from './value-objects/power-parameters';

export enum EffectInputType {
  TEXT = 'texto',
  NUMBER = 'numero',
  SELECT = 'select',
}

export enum EffectConfigurationType {
  SELECT = 'select',
  RADIO = 'radio',
}

export interface EffectConfigurationOption {
  id: string;
  nome: string;
  modificadorCusto: number;
  grauMinimo?: number;
  descricao: string;
  custoProgressivo?: 'dobrado';
}

export interface EffectConfiguration {
  tipo: EffectConfigurationType;
  label: string;
  opcoes: EffectConfigurationOption[];
}

interface EffectBaseProps {
  id: string;
  nome: string;
  custoBase: number;
  descricao: string;
  parametrosPadrao: PowerParameters;
  categorias: string[];
  exemplos?: string;
  requerInput?: boolean;
  tipoInput?: EffectInputType;
  labelInput?: string;
  opcoesInput?: string[];
  placeholderInput?: string;
  configuracoes?: EffectConfiguration;
  custom?: boolean;
}

export class EffectBase extends Entity<EffectBaseProps> {
  get effectId(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get custoBase(): number {
    return this.props.custoBase;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get parametrosPadrao(): PowerParameters {
    return this.props.parametrosPadrao;
  }

  get categorias(): string[] {
    return [...this.props.categorias];
  }

  get exemplos(): string | undefined {
    return this.props.exemplos;
  }

  get requerInput(): boolean {
    return this.props.requerInput ?? false;
  }

  get tipoInput(): EffectInputType | undefined {
    return this.props.tipoInput;
  }

  get labelInput(): string | undefined {
    return this.props.labelInput;
  }

  get placeholderInput(): string | undefined {
    return this.props.placeholderInput;
  }

  get opcoesInput(): string[] | undefined {
    return this.props.opcoesInput ? [...this.props.opcoesInput] : undefined;
  }

  get configuracoes(): EffectConfiguration | undefined {
    return this.props.configuracoes;
  }

  get custom(): boolean {
    return this.props.custom ?? false;
  }

  hasConfiguracoes(): boolean {
    return !!this.props.configuracoes && this.props.configuracoes.opcoes.length > 0;
  }

  hasCategoria(categoria: string): boolean {
    return this.props.categorias.includes(categoria);
  }

  isCustom(): boolean {
    return this.props.custom === true;
  }

  getConfiguracao(configuracaoId: string): EffectConfigurationOption | undefined {
    if (!this.props.configuracoes) return undefined;
    return this.props.configuracoes.opcoes.find((opt) => opt.id === configuracaoId);
  }

  isGrauValidoParaConfiguracao(grau: number, configuracaoId: string): boolean {
    const config = this.getConfiguracao(configuracaoId);
    if (!config) return true;

    if (config.grauMinimo !== undefined) {
      return grau >= config.grauMinimo;
    }

    return true;
  }

  private static validate(props: EffectBaseProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new DomainValidationError('ID do efeito é obrigatório', 'id');
    }

    if (!props.nome || props.nome.trim() === '') {
      throw new DomainValidationError('Nome do efeito é obrigatório', 'nome');
    }

    if (props.custoBase < 0) {
      throw new DomainValidationError('Custo base não pode ser negativo', 'custoBase');
    }

    if (props.custoBase > 100) {
      throw new DomainValidationError('Custo base não pode exceder 100', 'custoBase');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new DomainValidationError('Descrição do efeito é obrigatória', 'descricao');
    }

    if (props.requerInput) {
      if (!props.tipoInput) {
        throw new DomainValidationError('Efeito que requer input deve especificar o tipo', 'tipoInput');
      }
      if (!props.labelInput) {
        throw new DomainValidationError('Efeito que requer input deve ter uma label', 'labelInput');
      }

      if (props.tipoInput === EffectInputType.SELECT) {
        if (!props.opcoesInput || props.opcoesInput.length === 0) {
          throw new DomainValidationError('Efeito com input tipo "select" deve ter opções', 'opcoesInput');
        }
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
    props: Optional<
      EffectBaseProps,
      'custom' | 'exemplos' | 'requerInput' | 'configuracoes' | 'parametrosPadrao'
    >,
    id?: UniqueEntityId,
  ): EffectBase {
    EffectBase.validate(props as EffectBaseProps);

    const effectBase = new EffectBase(
      {
        ...props,
        custom: props.custom ?? false,
        parametrosPadrao: props.parametrosPadrao ?? PowerParameters.createDefault(),
      },
      id,
    );

    return effectBase;
  }

  static createCustom(props: Omit<EffectBaseProps, 'custom'>, id?: UniqueEntityId): EffectBase {
    return EffectBase.create(
      {
        ...props,
        custom: true,
      },
      id,
    );
  }
}
