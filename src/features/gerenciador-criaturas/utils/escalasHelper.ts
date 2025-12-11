import { ESCALAS } from '../../../data';

export function getNomeEscala(tipo: 'acao' | 'alcance' | 'duracao', valor: number): string {
  const escala = ESCALAS[tipo]?.escala.find((e) => e.valor === valor);
  return escala?.nome || `Nível ${valor}`;
}

export function getDescricaoEscala(tipo: 'acao' | 'alcance' | 'duracao', valor: number): string {
  const escala = ESCALAS[tipo]?.escala.find((e) => e.valor === valor);
  return escala?.descricao || '';
}
