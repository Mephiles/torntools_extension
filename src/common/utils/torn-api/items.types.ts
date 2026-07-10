import type { TornItemArmorCoveragePartEnum, TornItemTypeEnum, TornItemWeaponCategoryEnum } from "tornapi-typescript";

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

export type Vendor = { country: string; name: string };

export interface StaticItem {
	id: number;
	name: string;
	description: string;
	effect: null | string;
	requirement: null | string;
	image: string;
	type: TornItemTypeEnum;
	sub_type: string | null;
	is_masked: boolean;
	is_tradable: boolean;
	is_found_in_city: boolean;
	value: {
		buy_price: number | null;
		sell_price: number | null;
		vendor: null | Vendor;
	};
	details: WeaponDetails | ArmorDetails | null;
}

export type FullItem = StaticItem & { value: StaticItem["value"] & { market_price: number }; circulation: number };

export function isFullItem(item: StaticItem): item is FullItem {
	return "market_price" in item.value;
}

export interface ItemResolver {
	loadItem(id: number): StaticItem | FullItem | null;
	findItem(matcher: (item: StaticItem | FullItem) => boolean): StaticItem | FullItem | null;
	getStaticItem(id: number): StaticItem | null;
	hasFullItems(): boolean;
	getFullItem(id: number): FullItem | null;
	getAllStaticItems(): StaticItem[];
	getAllFullItems(): FullItem[];
}
