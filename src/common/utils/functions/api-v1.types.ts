import type { FactionV1, TornV1, UserV1 } from "tornapi-typescript";

export type UserV1BazaarResponse = UserV1["selections"]["bazaar"]["response"];
export type UserV1DisplayCaseResponse = UserV1["selections"]["display"]["response"];

export type FactionV1ArmorResponse = FactionV1["selections"]["armor"]["response"];
export type FactionV1BoostersResponse = FactionV1["selections"]["boosters"]["response"];
export type FactionV1CesiumResponse = FactionV1["selections"]["cesium"]["response"];
export type FactionV1CrimesResponse = FactionV1["selections"]["crimes"]["response"];
export type FactionV1DrugsResponse = FactionV1["selections"]["drugs"]["response"];
export type FactionV1MedicalResponse = FactionV1["selections"]["medical"]["response"];
export type FactionV1TemporaryResponse = FactionV1["selections"]["temporary"]["response"];
export type FactionV1WeaponsResponse = FactionV1["selections"]["weapons"]["response"];

export type TornV1PawnshopResponse = TornV1["selections"]["pawnshop"]["response"];
export type TornV1StatsResponse = TornV1["selections"]["stats"]["response"];

export type UserV1BazaarItem = UserV1BazaarResponse["bazaar"][number];

export type FactionV1Crimes = FactionV1CrimesResponse["crimes"];
