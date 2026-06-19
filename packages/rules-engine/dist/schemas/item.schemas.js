"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemSchema = exports.UpgradeMaterialSchema = exports.GeneralItemSchema = exports.AccessorySchema = exports.ArtifactSchema = exports.ConsumableSchema = exports.DefensiveEquipmentSchema = exports.WeaponSchema = exports.commonItemFields = exports.DamageDescriptorSchema = exports.SpoilageState = exports.DurabilityStatus = exports.EquipmentType = exports.WeaponRange = exports.ItemType = void 0;
exports.calculateItemBaseValue = calculateItemBaseValue;
exports.calculateItemSellPrice = calculateItemSellPrice;
exports.scaleWeaponDie = scaleWeaponDie;
const zod_1 = require("zod");
const domain_schemas_1 = require("./domain.schemas");
var ItemType;
(function (ItemType) {
    ItemType["WEAPON"] = "weapon";
    ItemType["DEFENSIVE_EQUIPMENT"] = "defensive-equipment";
    ItemType["CONSUMABLE"] = "consumable";
    ItemType["ARTIFACT"] = "artifact";
    ItemType["ACCESSORY"] = "accessory";
    ItemType["GENERAL"] = "general";
    ItemType["UPGRADE_MATERIAL"] = "upgrade-material";
})(ItemType || (exports.ItemType = ItemType = {}));
var WeaponRange;
(function (WeaponRange) {
    WeaponRange["ADJACENTE"] = "adjacente";
    WeaponRange["NATURAL"] = "natural";
    WeaponRange["CURTO"] = "curto";
    WeaponRange["MEDIO"] = "medio";
    WeaponRange["LONGO"] = "longo";
})(WeaponRange || (exports.WeaponRange = WeaponRange = {}));
var EquipmentType;
(function (EquipmentType) {
    EquipmentType["TRAJE"] = "traje";
    EquipmentType["PROTECAO"] = "protecao";
})(EquipmentType || (exports.EquipmentType = EquipmentType = {}));
var DurabilityStatus;
(function (DurabilityStatus) {
    DurabilityStatus["INTACTO"] = "INTACTO";
    DurabilityStatus["DANIFICADO"] = "DANIFICADO";
})(DurabilityStatus || (exports.DurabilityStatus = DurabilityStatus = {}));
var SpoilageState;
(function (SpoilageState) {
    SpoilageState["PERFEITA"] = "PERFEITA";
    SpoilageState["BOA"] = "BOA";
    SpoilageState["NORMAL"] = "NORMAL";
    SpoilageState["RUIM"] = "RUIM";
    SpoilageState["TERRIVEL"] = "TERRIVEL";
})(SpoilageState || (exports.SpoilageState = SpoilageState = {}));
exports.DamageDescriptorSchema = zod_1.z.object({
    dado: zod_1.z.string().regex(/^\d+d\d+$/, 'Formato inválido, use NdN (ex: 1d8)'),
    base: zod_1.z.string().min(1),
    espiritual: zod_1.z.boolean(),
});
exports.commonItemFields = {
    id: zod_1.z.string().uuid().optional(),
    userId: zod_1.z.string().uuid().nullable().optional(),
    characterId: zod_1.z.string().uuid().nullable().optional(),
    nome: zod_1.z.string().min(2).max(100),
    descricao: zod_1.z.string().min(10).max(1000),
    dominio: domain_schemas_1.DomainSchema,
    custoBase: zod_1.z.number().int().min(0),
    nivelItem: zod_1.z.number().int().min(1).default(1),
    durabilidade: zod_1.z.nativeEnum(DurabilityStatus).default(DurabilityStatus.INTACTO),
    canStack: zod_1.z.boolean().default(false),
    maxStack: zod_1.z.number().int().min(2).default(2),
    icone: zod_1.z.string().url('Ícone deve ser um link válido').nullable().optional(),
    isPublic: zod_1.z.boolean().default(false),
    notas: zod_1.z.string().max(2000).nullable().optional(),
    powerIds: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    powerArrayIds: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    createdAt: zod_1.z.date().optional(),
    updatedAt: zod_1.z.date().nullable().optional(),
};
exports.WeaponSchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.WEAPON),
    danos: zod_1.z.array(exports.DamageDescriptorSchema).min(1),
    critMargin: zod_1.z.number().int().min(2).max(20),
    critMultiplier: zod_1.z.number().int().min(1).max(7),
    alcance: zod_1.z.nativeEnum(WeaponRange),
    alcanceExtraMetros: zod_1.z.number().min(0).multipleOf(0.5).default(0),
    atributoEscalonamento: zod_1.z.string().min(1).nullable().optional(),
    upgradeLevelValue: zod_1.z.number().int().min(0).max(7).default(0),
    upgradeLevelMax: zod_1.z.number().int().default(7),
}).superRefine((data, ctx) => {
    if (data.alcance !== WeaponRange.NATURAL && data.alcanceExtraMetros > 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['alcanceExtraMetros'],
            message: 'Apenas armas de alcance natural podem ter alcance extra',
        });
    }
});
exports.DefensiveEquipmentSchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.DEFENSIVE_EQUIPMENT),
    tipoEquipamento: zod_1.z.nativeEnum(EquipmentType),
    baseRD: zod_1.z.number().int().min(1).default(2),
    upgradeLevelValue: zod_1.z.number().int().min(0).max(9).default(0),
    upgradeLevelMax: zod_1.z.number().int().default(9),
    atributoEscalonamento: zod_1.z.string().min(1).nullable().optional(),
});
exports.ConsumableSchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.CONSUMABLE),
    descritorEfeito: zod_1.z.string().min(1).max(500),
    qtdDoses: zod_1.z.number().int().min(1),
    isRefeicao: zod_1.z.boolean(),
    spoilageState: zod_1.z.nativeEnum(SpoilageState).optional().nullable(),
});
exports.ArtifactSchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.ARTIFACT),
    isAttuned: zod_1.z.boolean().default(false),
});
exports.AccessorySchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.ACCESSORY),
});
exports.GeneralItemSchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.GENERAL),
});
exports.UpgradeMaterialSchema = zod_1.z.object({
    ...exports.commonItemFields,
    tipo: zod_1.z.literal(ItemType.UPGRADE_MATERIAL),
    tier: zod_1.z.number().int().min(1).max(4),
    maxUpgradeLimit: zod_1.z.number().int().min(1),
});
exports.ItemSchema = zod_1.z.discriminatedUnion('tipo', [
    exports.WeaponSchema,
    exports.DefensiveEquipmentSchema,
    exports.ConsumableSchema,
    exports.ArtifactSchema,
    exports.AccessorySchema,
    exports.GeneralItemSchema,
    exports.UpgradeMaterialSchema,
]);
function calculateItemBaseValue(custoBase, nivelItem) {
    return custoBase * nivelItem;
}
function calculateItemSellPrice(custoBase, nivelItem) {
    return Math.floor(calculateItemBaseValue(custoBase, nivelItem) / 2);
}
function scaleWeaponDie(dado, upgradeLevelValue) {
    if (upgradeLevelValue === 0)
        return dado;
    const [count, size] = dado.split('d').map(Number);
    const multiplier = Math.pow(2, upgradeLevelValue);
    const newSize = size * multiplier;
    return `${count}d${newSize}`;
}
