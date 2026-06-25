import { z } from 'zod';
export var DomainName;
(function (DomainName) {
    DomainName["NATURAL"] = "natural";
    DomainName["SAGRADO"] = "sagrado";
    DomainName["SACRILEGIO"] = "sacrilegio";
    DomainName["PSIQUICO"] = "psiquico";
    DomainName["CIENTIFICO"] = "cientifico";
    DomainName["PECULIAR"] = "peculiar";
    DomainName["ARMA_BRANCA"] = "arma-branca";
    DomainName["ARMA_FOGO"] = "arma-fogo";
    DomainName["ARMA_TENSAO"] = "arma-tensao";
    DomainName["ARMA_EXPLOSIVA"] = "arma-explosiva";
    DomainName["ARMA_TECNOLOGICA"] = "arma-tecnologica";
    DomainName["DESARMADO"] = "desarmado";
})(DomainName || (DomainName = {}));
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
export function isEspiritual(domainName) {
    return [
        DomainName.NATURAL,
        DomainName.SAGRADO,
        DomainName.SACRILEGIO,
        DomainName.PSIQUICO,
    ].includes(domainName);
}
