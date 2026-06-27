import { z } from 'zod';
export declare enum ItemType {
    WEAPON = "weapon",
    DEFENSIVE_EQUIPMENT = "defensive-equipment",
    CONSUMABLE = "consumable",
    ARTIFACT = "artifact",
    ACCESSORY = "accessory",
    GENERAL = "general",
    UPGRADE_MATERIAL = "upgrade-material"
}
export declare enum WeaponRange {
    ADJACENTE = "adjacente",
    NATURAL = "natural",
    CURTO = "curto",
    MEDIO = "medio",
    LONGO = "longo"
}
export declare enum EquipmentType {
    TRAJE = "traje",
    PROTECAO = "protecao"
}
export declare enum DurabilityStatus {
    INTACTO = "INTACTO",
    DANIFICADO = "DANIFICADO"
}
export declare enum SpoilageState {
    PERFEITA = "PERFEITA",
    BOA = "BOA",
    NORMAL = "NORMAL",
    RUIM = "RUIM",
    TERRIVEL = "TERRIVEL"
}
export declare const DamageDescriptorSchema: z.ZodObject<{
    dado: z.ZodString;
    base: z.ZodString;
    espiritual: z.ZodBoolean;
}, z.core.$strip>;
export type DamageDescriptor = z.infer<typeof DamageDescriptorSchema>;
export declare const commonItemFields: {
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
};
export declare const WeaponSchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.WEAPON>;
    danos: z.ZodArray<z.ZodObject<{
        dado: z.ZodString;
        base: z.ZodString;
        espiritual: z.ZodBoolean;
    }, z.core.$strip>>;
    critMargin: z.ZodNumber;
    critMultiplier: z.ZodNumber;
    alcance: z.ZodEnum<typeof WeaponRange>;
    alcanceExtraMetros: z.ZodDefault<z.ZodNumber>;
    atributoEscalonamento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    upgradeLevelValue: z.ZodDefault<z.ZodNumber>;
    upgradeLevelMax: z.ZodDefault<z.ZodNumber>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const DefensiveEquipmentSchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.DEFENSIVE_EQUIPMENT>;
    tipoEquipamento: z.ZodEnum<typeof EquipmentType>;
    baseRD: z.ZodDefault<z.ZodNumber>;
    upgradeLevelValue: z.ZodDefault<z.ZodNumber>;
    upgradeLevelMax: z.ZodDefault<z.ZodNumber>;
    atributoEscalonamento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const ConsumableSchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.CONSUMABLE>;
    descritorEfeito: z.ZodString;
    qtdDoses: z.ZodNumber;
    isRefeicao: z.ZodBoolean;
    spoilageState: z.ZodNullable<z.ZodOptional<z.ZodEnum<typeof SpoilageState>>>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const ArtifactSchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.ARTIFACT>;
    isAttuned: z.ZodDefault<z.ZodBoolean>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const AccessorySchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.ACCESSORY>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const GeneralItemSchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.GENERAL>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const UpgradeMaterialSchema: z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.UPGRADE_MATERIAL>;
    tier: z.ZodNumber;
    maxUpgradeLimit: z.ZodNumber;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
export declare const ItemSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.WEAPON>;
    danos: z.ZodArray<z.ZodObject<{
        dado: z.ZodString;
        base: z.ZodString;
        espiritual: z.ZodBoolean;
    }, z.core.$strip>>;
    critMargin: z.ZodNumber;
    critMultiplier: z.ZodNumber;
    alcance: z.ZodEnum<typeof WeaponRange>;
    alcanceExtraMetros: z.ZodDefault<z.ZodNumber>;
    atributoEscalonamento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    upgradeLevelValue: z.ZodDefault<z.ZodNumber>;
    upgradeLevelMax: z.ZodDefault<z.ZodNumber>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>, z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.DEFENSIVE_EQUIPMENT>;
    tipoEquipamento: z.ZodEnum<typeof EquipmentType>;
    baseRD: z.ZodDefault<z.ZodNumber>;
    upgradeLevelValue: z.ZodDefault<z.ZodNumber>;
    upgradeLevelMax: z.ZodDefault<z.ZodNumber>;
    atributoEscalonamento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>, z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.CONSUMABLE>;
    descritorEfeito: z.ZodString;
    qtdDoses: z.ZodNumber;
    isRefeicao: z.ZodBoolean;
    spoilageState: z.ZodNullable<z.ZodOptional<z.ZodEnum<typeof SpoilageState>>>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>, z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.ARTIFACT>;
    isAttuned: z.ZodDefault<z.ZodBoolean>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>, z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.ACCESSORY>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>, z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.GENERAL>;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>, z.ZodObject<{
    tipo: z.ZodLiteral<ItemType.UPGRADE_MATERIAL>;
    tier: z.ZodNumber;
    maxUpgradeLimit: z.ZodNumber;
    id: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    characterId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nome: z.ZodString;
    descricao: z.ZodString;
    dominio: z.ZodObject<{
        name: z.ZodEnum<typeof import("./domain.schemas.js").DomainName>;
        areaConhecimento: z.ZodOptional<z.ZodString>;
        peculiarId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    custoBase: z.ZodNumber;
    nivelItem: z.ZodDefault<z.ZodNumber>;
    durabilidade: z.ZodDefault<z.ZodEnum<typeof DurabilityStatus>>;
    canStack: z.ZodDefault<z.ZodBoolean>;
    maxStack: z.ZodDefault<z.ZodNumber>;
    icone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    notas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    powerIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    powerArrayIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>], "tipo">;
export type ItemInput = z.infer<typeof ItemSchema>;
export declare function calculateItemBaseValue(custoBase: number, nivelItem: number): number;
export declare function calculateItemSellPrice(custoBase: number, nivelItem: number): number;
export declare function scaleWeaponDie(dado: string, upgradeLevelValue: number): string;
