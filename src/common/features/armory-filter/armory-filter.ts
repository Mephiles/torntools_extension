import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ITEM_RESOLVER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import type { WeaponBonusFilter } from "@common/utils/data/default-database";
import { findContainer } from "@common/utils/functions/containers";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import {
	checkboxSection,
	createFilter,
	createWeaponBonusSection,
	type FilterController,
	type FilterSectionDef,
	selectSection,
	textSection,
} from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { ARMOR_SETS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;
let filterItemType = "";

function addListener() {
	addCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, async ({ section }) => {
		if (!FEATURE_MANAGER.isEnabled(ArmoryFilterFeature)) return;

		if (["weapons", "armour", "temporary"].includes(section)) await rebuildForTab(section);
		else hideFilter();
	});
}

function buildSections(itemType: string): FilterSectionDef<unknown>[] {
	const base = [
		{
			...checkboxSection({
				key: "hideUnavailable",
				title: "Hide Unavailable",
				defaultValue: filters.factionArmory.hideUnavailable,
				test: (row, hideUnavailable) => {
					if (!hideUnavailable) return true;

					return !row.querySelector(":scope > .loaned a");
				},
			}),
			placement: "header" as const,
		},
		textSection({
			key: "name",
			title: "Name",
			defaultValue: filters.factionArmory[itemType].name ?? "",
			test: (row, name) => {
				if (!name) return true;
				return row.querySelector(".name")!.textContent.toLowerCase().includes(name.toLowerCase());
			},
		}),
	];

	if (itemType === "temporary") return base;

	if (itemType === "weapons") {
		return [
			...base,
			selectSection({
				key: "category",
				title: "Category",
				getOptions: () => [
					{ value: "", description: "All" },
					...["Melee", "Secondary", "Primary"].sort().map((t) => ({ value: t.toLowerCase(), description: t })),
				],
				defaultValue: filters.factionArmory.weapons.category,
				test: (row, category) => {
					if (!category) return true;
					const id = parseInt(row.querySelector<HTMLElement>(".img-wrap")!.dataset.itemid!);
					const item = ITEM_RESOLVER.getStaticItem(id);
					const cat = item?.details && "category" in item.details ? String(item.details.category).toLowerCase() : item?.type;
					return cat === category;
				},
			}),
			selectSection({
				key: "weaponType",
				title: "Weapon Type",
				getOptions: () => [
					{ value: "", description: "All" },
					...["Clubbing", "Piercing", "Slashing", "Mechanical", "Pistol", "Shotgun", "SMG", "Rifle", "Machine gun", "Heavy artillery"].map((t) => ({
						value: t.toLowerCase(),
						description: t,
					})),
				],
				defaultValue: filters.factionArmory.weapons.weaponType,
				test: (row, weaponType) => {
					if (!weaponType) return true;

					const id = parseInt(row.querySelector<HTMLElement>(".img-wrap")!.dataset.itemid!);
					return ITEM_RESOLVER.getStaticItem(id)?.sub_type?.toLowerCase() === weaponType;
				},
			}),
			textSection({
				key: "damage",
				title: "Damage",
				type: "number",
				defaultValue: filters.factionArmory.weapons.damage,
				test: (row, damage) => {
					const d = parseFloat(damage);
					if (Number.isNaN(d)) return true;

					return parseFloat(row.querySelector(".bonus-attachment-item-damage-bonus + span")!.textContent) >= d;
				},
			}),
			textSection({
				key: "accuracy",
				title: "Accuracy",
				type: "number",
				defaultValue: filters.factionArmory.weapons.accuracy,
				test: (row, accuracy) => {
					const a = parseFloat(accuracy);
					if (Number.isNaN(a)) return true;

					return parseFloat(row.querySelector(".bonus-attachment-item-accuracy-bonus + span")!.textContent) >= a;
				},
			}),
			{
				key: "weaponBonus",
				title: "Weapon Bonus",
				build(onChange: () => void) {
					const ws = createWeaponBonusSection({
						callback: onChange,
						defaults: filters.factionArmory.weapons.weaponBonus,
						configuration: { anyWeaponBonus: true },
					});
					return { element: ws.element, getValue: () => ws.getValues() };
				},
				test: (row, bonuses: WeaponBonusFilter[]) => {
					const toFilter = bonuses.filter(({ bonus }) => bonus);
					if (!toFilter.length) return true;

					const found = Array.from(row.querySelectorAll(".bonuses .bonus > i:not(.bonus-attachment-blank-bonus-25)"))
						.map((icon) => icon.getAttribute("title")!)
						.map((title) => title.split("<br/>"))
						.filter((values) => values.length >= 2)
						.map(([bonus, description]) => ({
							bonus: bonus.substring(3, bonus.length - 4).toLowerCase(),
							value: convertToNumber(description),
						}));

					if (toFilter.some(({ bonus }) => bonus === "any")) return found.length > 0;

					return toFilter.every(({ bonus, value }) => found.filter((f) => f.bonus === bonus && (!value || f.value >= value)).length > 0);
				},
			},
		];
	}

	// armor
	return [
		...base,
		textSection({
			key: "defence",
			title: "Defence",
			type: "number",
			defaultValue: filters.factionArmory.armor.defence,
			test: (row, defence) => {
				const d = parseFloat(defence);
				if (Number.isNaN(d)) return true;

				return parseFloat(row.querySelector(".bonus-attachment-item-defence-bonus + span")!.textContent) >= d;
			},
		}),
		selectSection({
			key: "set",
			title: "Set",
			getOptions: () => [
				{ value: "", description: "All" },
				{ value: "any", description: "Any (ranked)" },
				...ARMOR_SETS.map((s) => ({ value: s.toLowerCase(), description: s })),
			],
			defaultValue: filters.factionArmory.armor.set,
			test: (row, set) => {
				if (!set) return true;

				const rowSet = row.querySelector(".name")!.textContent.split(" ")[0].toLowerCase();
				if (set === "any") return ARMOR_SETS.map((x) => x.toLowerCase()).includes(rowSet);

				return rowSet === set;
			},
		}),
		textSection({
			key: "armorBonus",
			title: "Bonus %",
			type: "number",
			defaultValue: filters.factionArmory.armor.armorBonus,
			test: (row, armorBonus) => {
				const b = parseFloat(armorBonus);
				if (Number.isNaN(b)) return true;

				return convertToNumber(row.querySelector(".bonus > i[class*='bonus-attachment-']")?.getAttribute("title")) >= b;
			},
		}),
	];
}

async function rebuildForTab(section: string) {
	if (section === "armour") section = "armor";
	if (section !== "weapons" && section !== "armor" && section !== "temporary") return;

	filterItemType = section;
	filter?.dispose();

	filter = createFilter({
		rowSelector: ".torn-tabs ~ [aria-hidden*='false'] .item-list > li",
		container: {
			title: "Armory Filter",
			class: "mt10",
			nextElement: document.querySelector("#faction-armoury > hr")!,
		},
		statisticsLabel: "items",
		enabled: filters.factionArmory.enabled,
		sections: buildSections(section),
		onStateChange: async (state) => {
			const specificState: Omit<typeof state, "enabled"> = { ...state };
			delete specificState.enabled;
			delete specificState.hideUnavailable;

			await ttStorage.change({
				filters: {
					factionArmory: {
						enabled: state.enabled,
						hideUnavailable: state.hideUnavailable as boolean,
						[filterItemType]: specificState,
					},
				},
			});
		},
	});

	await requireElement(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.last");
	await filter.run();
}

function hideFilter() {
	findContainer("Armory Filter")?.classList.add("tt-hidden");
}

export default class ArmoryFilterFeature extends Feature {
	constructor() {
		super("Armory Filter", "faction");
	}

	precondition() {
		return isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.armoryFilter;
	}

	initialise() {
		addListener();
	}

	cleanup() {
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.faction.armoryFilter"];
	}

	shouldLiveReload() {
		return true;
	}
}
