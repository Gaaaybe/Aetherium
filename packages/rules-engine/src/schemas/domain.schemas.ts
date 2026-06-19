import { z } from 'zod';

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
  DESARMADO = 'desarmado',
}

export const DomainSchema = z
  .object({
    name: z.nativeEnum(DomainName),
    areaConhecimento: z.string().min(1).optional(),
    peculiarId: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.name === DomainName.CIENTIFICO && !data.areaConhecimento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['areaConhecimento'],
        message: 'Domínio Científico requer área de conhecimento',
      });
    }
    if (data.name === DomainName.PECULIAR && !data.peculiarId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['peculiarId'],
        message: 'Domínio Peculiar requer ID da peculiaridade',
      });
    }
  });

export type Domain = z.infer<typeof DomainSchema>;

export function isEspiritual(domainName: DomainName): boolean {
  return [
    DomainName.NATURAL,
    DomainName.SAGRADO,
    DomainName.SACRILEGIO,
    DomainName.PSIQUICO,
  ].includes(domainName);
}
