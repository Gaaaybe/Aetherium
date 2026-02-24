import { type Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { Power } from '../../enterprise/entities/power';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerGlobalModificationList } from '../../enterprise/entities/watched-lists/power-global-modification-list';
import type { PowersRepository } from '../repositories/powers-repository';

interface CopyPublicPowerUseCaseRequest {
  powerId: string;
  userId: string;
}

interface CopyPublicPowerUseCaseResponseData {
  power: Power;
}

type CopyPublicPowerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  CopyPublicPowerUseCaseResponseData
>;

export class CopyPublicPowerUseCase {
  constructor(private powersRepository: PowersRepository) {}

  async execute({
    powerId,
    userId,
  }: CopyPublicPowerUseCaseRequest): Promise<CopyPublicPowerUseCaseResponse> {
    const original = await this.powersRepository.findById(powerId);

    if (!original) {
      return left(new ResourceNotFoundError());
    }

    if (!original.canBeAccessedBy()) {
      return left(new NotAllowedError());
    }

    const effectsList = new PowerEffectList();
    effectsList.update(original.effects.getItems());

    const globalModificationsList = new PowerGlobalModificationList();
    globalModificationsList.update(original.globalModifications.getItems());

    const copy = Power.create({
      userId,
      nome: original.nome,
      descricao: original.descricao,
      dominio: original.dominio,
      parametros: original.parametros,
      effects: effectsList,
      globalModifications: globalModificationsList,
      custoTotal: original.custoTotal,
      custoAlternativo: original.custoAlternativo,
      notas: original.notas,
      isPublic: false,
    });

    await this.powersRepository.create(copy);

    return right({ power: copy });
  }
}
