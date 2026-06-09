import type { TornItemArmorCoveragePartEnum, TornItemTypeEnum, TornItemWeaponCategoryEnum, TornItemWeaponTypeEnum } from "tornapi-typescript";

export type StaticItems = StaticItem[];
export type StaticItemMap = { [id: string]: StaticItem };

export type WeaponDetails = {
	category: TornItemWeaponCategoryEnum;
	stealth_level: number;
	base_stats: {
		damage: number;
		accuracy: number;
		armor: 0;
	};
	ammo: null | {
		id: number;
		name: AmmoName;
		magazine_rounds: number;
		rate_of_fire: {
			minimum: number;
			maximum: number;
		};
	};
	mods: number[];
};

export type ArmorDetails = {
	coverage: null | { name: TornItemArmorCoveragePartEnum; value: number }[];
	base_stats: {
		damage: 0;
		accuracy: 0;
		armor: number;
	};
};

export type AmmoName =
	| "9mm Parabellum Round"
	| ".25 ACP Round"
	| ".44 Special Round"
	| "5.7mm High Vel. Round"
	| "12 Gauge Cartridge"
	| "5.56mm Rifle Round"
	| ".380 ACP Round"
	| "7.62mm Rifle Round"
	| "5.45mm Rifle Round"
	| "40mm Grenade"
	| "Dart"
	| "Bolt"
	| "Warhead"
	| "Stone"
	| "Snow Ball"
	| "Egg"
	| "Taser Cartridge"
	| "Flare"
	| "RPG"
	| "Liter of Fuel"
	| ".45 ACP Round";

export type Vendor =
	| { country: "Torn"; name: "Big Al's Gun Shop" }
	| { country: "Torn"; name: "Sally's Sweet Shop" }
	| { country: "Torn"; name: "the Jewelry Store" }
	| { country: "Torn"; name: "the Super Store" }
	| { country: "Torn"; name: "the Pharmacy" }
	| { country: "Torn"; name: "the Post Office" }
	| { country: "Torn"; name: "Bits 'n' Bobs" }
	| { country: "Torn"; name: "the Docks" }
	| { country: "Torn"; name: "the Print Shop" }
	| { country: "Torn"; name: "TC Clothing" }
	| { country: "Torn"; name: "the Recycling Center" }
	| { country: "Torn"; name: "Nikeh Sports" }
	| { country: "Mexico"; name: "Ciudad Juarez Shop" }
	| { country: "Canada"; name: "Toronto Shop" }
	| { country: "Cayman Islands"; name: "George Town Shop" }
	| { country: "Hawaii"; name: "Honolulu Shop" }
	| { country: "Argentina"; name: "Buenos Aires Shop" }
	| { country: "United Kingdom"; name: "London Shop" }
	| { country: "Switzerland"; name: "Zurich Shop" }
	| { country: "Japan"; name: "Tokyo Shop" }
	| { country: "China"; name: "Beijing Shop" }
	| { country: "UAE"; name: "Dubai Shop" }
	| { country: "South Africa"; name: "Johannesburg Shop" };

export type StaticItem = {
	id: number;
	name: string;
	description: string;
	effect: null | string;
	requirement: null | string;
	image: string;
	is_masked: boolean;
	is_tradable: boolean;
	is_found_in_city: boolean;
	value: {
		buy_price: number | null;
		sell_price: number | null;
		vendor: null | Vendor;
	};
} & (
	| { type: "Weapon"; sub_type: TornItemWeaponTypeEnum | null; details: WeaponDetails }
	| { type: "Armor"; sub_type: null; details: ArmorDetails }
	| { type: "Unused"; sub_type: null; details?: unknown }
	| { type: Exclude<TornItemTypeEnum, "Weapon" | "Armor" | "Unused">; sub_type: null }
);

export type AllItemTypes = StaticItem["type"];
export type AllItemSubTypes = StaticItem["sub_type"];
