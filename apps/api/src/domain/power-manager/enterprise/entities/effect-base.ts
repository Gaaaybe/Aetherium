import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';
import { PowerParameters, ActionType, RangeType, DurationType } from './value-objects/power-parameters';

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
      throw new Error('ID do efeito é obrigatório');
    }

    if (!props.nome || props.nome.trim() === '') {
      throw new Error('Nome do efeito é obrigatório');
    }

    if (props.custoBase < 0) {
      throw new Error('Custo base não pode ser negativo');
    }

    if (props.custoBase > 100) {
      throw new Error('Custo base não pode exceder 100');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new Error('Descrição do efeito é obrigatória');
    }

    if (props.requerInput) {
      if (!props.tipoInput) {
        throw new Error('Efeito que requer input deve especificar o tipo');
      }
      if (!props.labelInput) {
        throw new Error('Efeito que requer input deve ter uma label');
      }

      if (props.tipoInput === EffectInputType.SELECT) {
        if (!props.opcoesInput || props.opcoesInput.length === 0) {
          throw new Error('Efeito com input tipo "select" deve ter opções');
        }
        throw new Error('Efeito que requer input deve especificar o tipo');
      }
      if (!props.labelInput) {
        throw new Error('Efeito que requer input deve ter uma label');
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
    props: Optional<
      EffectBaseProps,
      'custom' | 'exemplos' | 'requerInput' | 'configuracoes' | 'parametrosPadrao'
    >,
    id?: UniqueEntityId,
  ): EffectBase {
    this.validate(props as EffectBaseProps);

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

  static createCustom(
    props: Omit<EffectBaseProps, 'custom'>,
    id?: UniqueEntityId,
  ): EffectBase {
    return EffectBase.create(
      {
        ...props,
        custom: true,
      },
      id,
    );
  }
}