import type { CompanyV1, FactionV1, TornV1, UserV1 } from "tornapi-typescript";

export type UserV1AmmoResponse = UserV1["selections"]["ammo"]["response"];
export type UserV1BarsResponse = UserV1["selections"]["bars"]["response"];
export type UserV1BazaarResponse = UserV1["selections"]["bazaar"]["response"];
export type UserV1EducationResponse = UserV1["selections"]["education"]["response"];
export type UserV1PerksResponse = UserV1["selections"]["perks"]["response"];
export type UserV1NetworthResponse = UserV1["selections"]["networth"]["response"];

export type FactionV1ArmorResponse = FactionV1["selections"]["armor"]["response"];
export type FactionV1BoostersResponse = FactionV1["selections"]["boosters"]["response"];
export type FactionV1CesiumResponse = FactionV1["selections"]["cesium"]["response"];
export type FactionV1CrimesResponse = FactionV1["selections"]["crimes"]["response"];
export type FactionV1CurrencyResponse = FactionV1["selections"]["currency"]["response"];
export type FactionV1DrugsResponse = FactionV1["selections"]["drugs"]["response"];
export type FactionV1MedicalResponse = FactionV1["selections"]["medical"]["response"];
export type FactionV1TemporaryResponse = FactionV1["selections"]["temporary"]["response"];
export type FactionV1WeaponsResponse = FactionV1["selections"]["weapons"]["response"];

export type CompanyV1EmployeesResponse = CompanyV1["selections"]["employees"]["response"];
export type CompanyV1ProfileResponse = CompanyV1["selections"]["profile"]["response"];

export type TornV1BankResponse = TornV1["selections"]["bank"]["response"];
export type TornV1ItemsResponse = TornV1["selections"]["items"]["response"];
export type TornV1PawnshopResponse = TornV1["selections"]["pawnshop"]["response"];
export type TornV1StatsResponse = TornV1["selections"]["stats"]["response"];
export type TornV1StocksResponse = TornV1["selections"]["stocks"]["response"];

export type UserV1Bar = UserV1BarsResponse["nerve"];
export type UserV1BazaarItem = UserV1BazaarResponse["bazaar"][number];
export type UserV1ChainBar = UserV1BarsResponse["chain"];

export type FactionV1Crimes = FactionV1CrimesResponse["crimes"];

export type CompanyV1Employees = CompanyV1ProfileResponse["company"]["employees"];

export type TornV1Bank = TornV1BankResponse["bank"];
export type TornV1Items = TornV1ItemsResponse["items"];
export type TornV1Stock = TornV1StocksResponse["stocks"][number];
