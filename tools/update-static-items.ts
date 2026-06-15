#!/usr/bin/env node
import { exec } from "node:child_process";
import { writeFile } from "node:fs/promises";
import * as process from "node:process";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import type { AmmoName, StaticItem, StaticItemMap, StaticItems, Vendor } from "@common/utils/torn-api/items.types";
import type { TornItem, TornItemArmorDetails, TornItemsResponse, TornItemWeaponDetails } from "tornapi-typescript";

const WORKING_DIRECTORY = "src/extension/utils/static-data";
const execAsync = promisify(exec);

if (!process.cwd().endsWith(WORKING_DIRECTORY)) {
	process.chdir(WORKING_DIRECTORY);
}

type ApiErrorResponse = {
	code: number;
	error: string;
};

type ApiResult = TornItemsResponse | ApiErrorResponse;

const cli = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const key = await cli.question("Please provide a public api key: ");
cli.close();

const response = await fetch(`https://api.torn.com/v2/torn/?key=${key}&comment=tt-static&selections=items`);
const result = (await response.json()) as ApiResult;

if (!("items" in result)) {
	console.error("Failed to fetch the items.", result);
	process.exit(1);
}

function isWeaponDetails(details: TornItemWeaponDetails | TornItemArmorDetails | null): details is TornItemWeaponDetails {
	return details && "category" in details;
}

function isArmorDetails(details: TornItemWeaponDetails | TornItemArmorDetails | null): details is TornItemArmorDetails {
	return details && "coverage" in details;
}

function tornItemToStaticItem(item: TornItem): StaticItem {
	const base = {
		id: item.id,
		name: item.name,
		description: item.description,
		effect: item.effect,
		requirement: item.requirement,
		image: item.image,
		type: item.type,
		sub_type: item.sub_type,
		is_masked: item.is_masked,
		is_tradable: item.is_tradable,
		is_found_in_city: item.is_found_in_city,
		value: {
			buy_price: item.value.buy_price,
			sell_price: item.value.sell_price,
			vendor: item.value.vendor as Vendor | null,
		},
		details: null,
	};

	if (item.type === "Weapon" && isWeaponDetails(item.details)) {
		return {
			...base,
			details: {
				category: item.details.category,
				stealth_level: item.details.stealth_level,
				base_stats: {
					damage: item.details.base_stats.damage,
					accuracy: item.details.base_stats.accuracy,
					armor: 0,
				},
				ammo: item.details.ammo
					? {
							id: item.details.ammo.id,
							name: item.details.ammo.name as AmmoName,
							magazine_rounds: item.details.ammo.magazine_rounds,
							rate_of_fire: item.details.ammo.rate_of_fire,
						}
					: null,
				mods: item.details.mods,
			},
		};
	}

	if (item.type === "Armor" && isArmorDetails(item.details)) {
		return {
			...base,
			type: "Armor",
			sub_type: null,
			details: {
				coverage: item.details.coverage,
				base_stats: {
					damage: 0,
					accuracy: 0,
					armor: item.details.base_stats.armor,
				},
			},
		};
	}

	return base;
}

const staticItems: StaticItems = result.items.map(tornItemToStaticItem);

const staticItemMap: StaticItemMap = staticItems.reduce((acc, item) => {
	acc[item.id] = item;
	return acc;
}, {} as StaticItemMap);

const fileOutput = `// Don't update this file manually. Changes might be overwritten by the script located in 'tools/update-static-items.ts'.
import type { StaticItemMap, StaticItems } from "@common/utils/torn-api/items.types";

export const STATIC_ITEMS: StaticItems = ${JSON.stringify(staticItems, null, 2)};

export const STATIC_ITEM_MAP: StaticItemMap = ${JSON.stringify(staticItemMap, null, 2)};
`;

await writeFile("./static-items.ts", fileOutput);

const { stdout, stderr } = await execAsync("biome check --write ./static-items.ts");

if (stdout) console.log(`stdout: ${stdout}`);
if (stderr) console.error(`stderr: ${stderr}`);

console.log("Static items updated successfully.");
