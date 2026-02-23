import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';
import { PowerCost } from './value-objects/power-cost';
import { AppliedModification, ModificationScope } from './value-objects/applied-modification';

interface AppliedEffectProps {
  effectBaseId: string;
  grau: number;
  configuracaoId?: string;
  inputValue?: string | number;
  modifications: AppliedModification[];
  custo: PowerCost;
  nota?: string;
}

export class AppliedEffect extends Entity<AppliedEffectProps> {
  get effectBaseId(): string {
    return this.props.effectBaseId;
  }

  get grau(): number {
    return this.props.grau;
  }

  get configuracaoId(): string | undefined {
    return this.props.configuracaoId;
  }

  get inputValue(): string | number | undefined {
    return this.props.inputValue;
  }

  get modifications(): AppliedModification[] {
    return [...this.props.modifications];
  }

  get custo(): PowerCost {
    return this.props.custo;
  }

  get nota(): string | undefined {
    return this.props.nota;
  }

  hasModifications(): boolean {
    return this.props.modifications.length > 0;
  }

  getModificationsByScope(scope: ModificationScope): AppliedModification[] {
    return this.props.modifications.filter((mod) => mod.scope === scope);
  }

  addModification(modification: AppliedModification): AppliedEffect {
    const modifications = [...this.props.modifications, modification];

    return new AppliedEffect(
      {
        ...this.props,
        modifications,
      },
      this.id,
    );
  }

  removeModification(index: number): AppliedEffect {
    if (index < 0 || index >= this.props.modifications.length) {
      throw new Error('Índice de modificação inválido');
    }

    const modifications = this.props.modifications.filter((_, i) => i !== index);

    return new AppliedEffect(
      {
        ...this.props,
        modifications,
      },
      this.id,
    );
  }

  updateCost(custo: PowerCost): AppliedEffect {
    return new AppliedEffect(
      {
        ...this.props,
        custo,
      },
      this.id,
    );
  }

  updateGrau(grau: number): AppliedEffect {
    if (grau < 1) {
      throw new Error('Grau do efeito deve ser no mínimo 1');
    }

    if (grau > 30) {
      throw new Error('Grau do efeito não pode exceder 30');
    }

    return new AppliedEffect(
      {
        ...this.props,
        grau,
      },
      this.id,
    );
  }

  updateNota(nota: string): AppliedEffect {
    return new AppliedEffect(
      {
        ...this.props,
        nota,
      },
      this.id,
    );
  }

  private static validate(props: AppliedEffectProps): void {
    if (!props.effectBaseId || props.effectBaseId.trim() === '') {
      throw new Error('effectBaseId é obrigatório');
    }

    if (props.grau < 1) {
      throw new Error('Grau do efeito deve ser no mínimo 1');
    }

    if (props.grau > 30) {
      throw new Error('Grau do efeito não pode exceder 30');
    }
  }

  static create(
    props: Optional<AppliedEffectProps, 'modifications' | 'nota'>,
    id?: UniqueEntityId,
  ): AppliedEffect {
    const appliedEffect = new AppliedEffect(
      {
        ...props,
        modifications: props.modifications ?? [],
        nota: props.nota,
      },
      id,
    );

    this.validate(appliedEffect.props);

    return appliedEffect;
  }
}
