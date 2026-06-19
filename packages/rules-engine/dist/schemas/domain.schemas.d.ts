import { z } from 'zod';
export declare enum DomainName {
    NATURAL = "natural",
    SAGRADO = "sagrado",
    SACRILEGIO = "sacrilegio",
    PSIQUICO = "psiquico",
    CIENTIFICO = "cientifico",
    PECULIAR = "peculiar",
    ARMA_BRANCA = "arma-branca",
    ARMA_FOGO = "arma-fogo",
    ARMA_TENSAO = "arma-tensao",
    ARMA_EXPLOSIVA = "arma-explosiva",
    ARMA_TECNOLOGICA = "arma-tecnologica",
    DESARMADO = "desarmado"
}
export declare const DomainSchema: z.ZodObject<{
    name: z.ZodEnum<typeof DomainName>;
    areaConhecimento: z.ZodOptional<z.ZodString>;
    peculiarId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Domain = z.infer<typeof DomainSchema>;
export declare function isEspiritual(domainName: DomainName): boolean;
