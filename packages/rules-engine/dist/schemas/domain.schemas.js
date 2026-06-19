"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainSchema = exports.DomainName = void 0;
exports.isEspiritual = isEspiritual;
const zod_1 = require("zod");
var DomainName;
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
})(DomainName || (exports.DomainName = DomainName = {}));
exports.DomainSchema = zod_1.z
    .object({
    name: zod_1.z.nativeEnum(DomainName),
    areaConhecimento: zod_1.z.string().min(1).optional(),
    peculiarId: zod_1.z.string().min(1).optional(),
})
    .superRefine((data, ctx) => {
    if (data.name === DomainName.CIENTIFICO && !data.areaConhecimento) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['areaConhecimento'],
            message: 'Domínio Científico requer área de conhecimento',
        });
    }
    if (data.name === DomainName.PECULIAR && !data.peculiarId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['peculiarId'],
            message: 'Domínio Peculiar requer ID da peculiaridade',
        });
    }
});
function isEspiritual(domainName) {
    return [
        DomainName.NATURAL,
        DomainName.SAGRADO,
        DomainName.SACRILEGIO,
        DomainName.PSIQUICO,
    ].includes(domainName);
}
