import { InMemoryPowersRepository } from '@test/repositories/in-memory-powers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { Power } from '../../enterprise/entities/power';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { CopyPublicPowerUseCase } from './copy-public-power';

describe('CopyPublicPowerUseCase', () => {
  let sut: CopyPublicPowerUseCase;
  let powersRepository: InMemoryPowersRepository;

  beforeEach(() => {
    powersRepository = new InMemoryPowersRepository();
    sut = new CopyPublicPowerUseCase(powersRepository);
  });

  function makeEffectList() {
    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    return effectsList;
  }

  it('should copy a public power for a user', async () => {
    const original = Power.create({
      userId: 'outro-usuario',
      nome: 'Rajada de Energia',
      descricao: 'Dispara uma rajada de energia',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: makeEffectList(),
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      isPublic: true,
    });

    await powersRepository.create(original);

    const result = await sut.execute({
      powerId: original.id.toString(),
      userId: 'usuario-copiando',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const copy = result.value.power;
      expect(copy.id.equals(original.id)).toBe(false);
      expect(copy.userId).toBe('usuario-copiando');
      expect(copy.nome).toBe('Rajada de Energia');
      expect(copy.isPublic).toBe(false);
      expect(copy.isOwnedBy('usuario-copiando')).toBe(true);
    }
  });

  it('should copy an official power for a user', async () => {
    const official = Power.createOfficial({
      nome: 'Poder Oficial',
      descricao: 'Um poder do sistema',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: makeEffectList(),
      custoTotal: PowerCost.create({ pda: 5, pe: 0, espacos: 5 }),
    });

    await powersRepository.create(official);

    const result = await sut.execute({
      powerId: official.id.toString(),
      userId: 'usuario-qualquer',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const copy = result.value.power;
      expect(copy.isOfficial()).toBe(false);
      expect(copy.userId).toBe('usuario-qualquer');
      expect(copy.isPublic).toBe(false);
    }
  });

  it('should return ResourceNotFoundError if power does not exist', async () => {
    const result = await sut.execute({
      powerId: 'poder-inexistente',
      userId: 'usuario-qualquer',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return NotAllowedError when trying to copy a private power', async () => {
    const privatePower = Power.create({
      userId: 'dono-original',
      nome: 'Poder Privado',
      descricao: 'Este poder é privado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: makeEffectList(),
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      isPublic: false,
    });

    await powersRepository.create(privatePower);

    const result = await sut.execute({
      powerId: privatePower.id.toString(),
      userId: 'outro-usuario',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it('should preserve all data from the original power in the copy', async () => {
    const original = Power.create({
      userId: 'autor',
      nome: 'Poder Completo',
      descricao: 'Descrição detalhada',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: makeEffectList(),
      custoTotal: PowerCost.create({ pda: 10, pe: 2, espacos: 5 }),
      notas: 'Notas do criador',
      isPublic: true,
    });

    await powersRepository.create(original);

    const result = await sut.execute({
      powerId: original.id.toString(),
      userId: 'copiador',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const copy = result.value.power;
      expect(copy.nome).toBe(original.nome);
      expect(copy.descricao).toBe(original.descricao);
      expect(copy.notas).toBe(original.notas);
      expect(copy.custoTotal.pda).toBe(original.custoTotal.pda);
      expect(copy.custoTotal.pe).toBe(original.custoTotal.pe);
      expect(copy.custoTotal.espacos).toBe(original.custoTotal.espacos);
      expect(copy.effects.getItems()).toHaveLength(original.effects.getItems().length);
    }
  });
});
