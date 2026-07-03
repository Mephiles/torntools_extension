import { FEATURE_MANAGER, ITEM_RESOLVER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import type { WeaponBonusFilter } from "@common/utils/data/default-database";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import {
	createFilter,
	createWeaponBonusSection,
	type FilterController,
	type FilterSectionDef,
	selectSection,
	textSection,
} from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { ARMOR_SETS, ITEM_TYPES } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;
let filterItemType = "";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.AUCTION_SWITCH_TYPE, async ({ type }) => {
		if (!FEATURE_MANAGER.isEnabled(AuctionHouseFilterFeature)) return;

		await rebuildForTab(type);
	});
	addCustomListener(EVENT_CHANNELS.SWITCH_PAGE, () => {
		if (!FEATURE_MANAGER.isEnabled(AuctionHouseFilterFeature)) return;

		void filter?.run();
	});
}

function buildSections(itemType: string): FilterSectionDef<unknown>[] {
	const base = [
		textSection({
			key: "name",
			title: "Name",
			defaultValue: filters.auction[itemType].name ?? "",
			test: (row, name) => {
				if (!name) return true;

				return row.querySelector(".item-name")!.textContent.toLowerCase().includes(name.toLowerCase());
			},
		}),
	];

	if (itemType === "temporary") return base;

	if (itemType === "items") {
		return [
			...base,
			selectSection({
				key: "category",
				title: "Category",
				getOptions: () => [{ value: "", description: "All" }, ...getCategories(itemType)],
				defaultValue: filters.auction.items.category,
				test: (row, category) => {
					if (!category) return true;
					const id = getItemId(row);
					const item = ITEM_RESOLVER.getStaticItem(id);
					const cat = item?.details && "category" in item.details ? String(item.details.category).toLowerCase() : item?.type;
					return cat === category;
				},
			}),
		];
	}

	if (itemType === "weapons") {
		return [
			...base,
			selectSection({
				key: "category",
				title: "Category",
				getOptions: () => [{ value: "", description: "All" }, ...getCategories(itemType)],
				defaultValue: filters.auction.weapons.category,
				test: (row, category) => {
					if (!category) return true;

					const id = getItemId(row);
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
				defaultValue: filters.auction.weapons.weaponType,
				test: (row, weaponType) => {
					if (!weaponType) return true;

					const id = getItemId(row);
					return ITEM_RESOLVER.getStaticItem(id)?.sub_type?.toLowerCase() === weaponType;
				},
			}),
			textSection({
				key: "damage",
				title: "Damage",
				type: "number",
				defaultValue: filters.auction.weapons.damage,
				test: (row, damage) => {
					const d = parseFloat(damage);
					if (Number.isNaN(d)) return true;

					const label = row.querySelector(".bonus-attachment-item-damage-bonus + .label-value");
					if (!label) return false;

					return parseFloat(label.textContent) >= d;
				},
			}),
			textSection({
				key: "accuracy",
				title: "Accuracy",
				type: "number",
				defaultValue: filters.auction.weapons.accuracy,
				test: (row, accuracy) => {
					const a = parseFloat(accuracy);
					if (Number.isNaN(a)) return true;

					const label = row.querySelector(".bonus-attachment-item-accuracy-bonus + .label-value");
					if (!label) return false;

					return parseFloat(label.textContent) >= a;
				},
			}),
			{
				key: "weaponBonus",
				title: "Weapon Bonus",
				build(onChange: () => void) {
					const ws = createWeaponBonusSection({ callback: onChange, defaults: filters.auction.weapons.weaponBonus });
					return { element: ws.element, getValue: () => ws.getValues() };
				},
				test: (row, bonuses: WeaponBonusFilter[]) => {
					const toFilter = bonuses.filter(({ bonus }) => bonus);
					if (!toFilter.length) return true;

					const found = Array.from(row.querySelectorAll(".iconsbonuses .bonus-attachment-icons"))
						.map((icon) => icon.getAttribute("title")!)
						.map((title) => title.split("<br/>"))
						.filter((values) => values.length >= 2)
						.map(([bonus, description]) => ({
							bonus: bonus.substring(3, bonus.length - 4).toLowerCase(),
							value: convertToNumber(description),
						}));

					return toFilter.every(({ bonus, value }) => found.filter((f) => f.bonus === bonus && (!value || f.value >= value)).length > 0);
				},
			} as FilterSectionDef<unknown>,
			selectSection({
				key: "quality",
				title: "Quality",
				getOptions: () => [
					{ value: "all", description: "All" },
					{ value: "yellow", description: "Yellow" },
					{ value: "orange", description: "Orange" },
					{ value: "red", description: "Red" },
				],
				defaultValue: filters.auction.weapons.quality,
				test: (row, quality) => {
					if (!quality || quality === "all") return true;

					const match = row.querySelector(".item-plate")!.className.match(/yellow|orange|red/);
					return (match ? match[0] : "none") === quality;
				},
			}),
		];
	}

	// armor
	return [
		...base,
		textSection({
			key: "defence",
			title: "Defence",
			type: "number",
			defaultValue: filters.auction.armor.defence,
			test: (row, defence) => {
				const d = parseFloat(defence);
				if (Number.isNaN(d)) return true;

				const label = row.querySelector(".bonus-attachment-item-defence-bonus + .label-value");
				if (!label) return false;

				return parseFloat(label.textContent) >= d;
			},
		}),
		selectSection({
			key: "set",
			title: "Set",
			getOptions: () => [{ value: "", description: "All" }, ...ARMOR_SETS.map((s) => ({ value: s.toLowerCase(), description: s }))],
			defaultValue: filters.auction.armor.set,
			test: (row, set) => {
				if (!set) return true;

				const rowSet = row.querySelector(".item-cont-wrap .item-name")!.textContent.split(" ")[0].toLowerCase();
				return rowSet === set;
			},
		}),
		textSection({
			key: "armorBonus",
			title: "Bonus %",
			type: "number",
			defaultValue: filters.auction.armor.armorBonus,
			test: (row, armorBonus) => {
				const b = parseFloat(armorBonus);
				if (Number.isNaN(b)) return true;

				return convertToNumber(row.querySelector(".iconsbonuses .bonus-attachment-icons")?.getAttribute("title")) >= b;
			},
		}),
	];
}

async function rebuildForTab(itemType: string) {
	filterItemType = itemType;
	filter?.dispose();

	filter = createFilter({
		rowSelector: ".tabContent[aria-hidden='false'] .items-list > li[id]",
		container: {
			title: "Auction House Filter",
			class: "mt10",
			nextElement: document.querySelector("#auction-house-tabs")!,
		},
		statisticsLabel: "items",
		enabled: filters.auction.enabled,
		sections: buildSections(itemType),
		onStateChange: async (state) => {
			const specificState: Omit<typeof state, "enabled"> = { ...state };
			delete specificState.enabled;

			await ttStorage.change({
				filters: {
					auction: {
						enabled: state.enabled,
						[filterItemType]: specificState,
					},
				},
			});
			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Auction House Filter" });
		},
	});

	await requireElement(".tabContent[aria-hidden='false'] .items-list");
	await filter.run();
}

async function enableFilter() {
	const tab = await requireElement(".tabContent[aria-hidden='false']");
	await rebuildForTab(tab.dataset.itemtype!);
}

function getItemId(row: HTMLElement): number {
	return parseInt(row.querySelector<HTMLImageElement>("img.torn-item")!.src.match(/items\/([0-9]+)\/large.png/i)![1]);
}

function getCategories(itemType: string) {
	if (itemType === "weapons") {
		return ["Melee", "Secondary", "Primary", "Temporary"].sort().map((t) => ({ value: t.toLowerCase(), description: t }));
	}
	return ITEM_TYPES.filter((t) => !["Melee", "Secondary", "Primary", "Defensive", "Unused", "Book", "Temporary"].includes(t))
		.sort()
		.map((t) => ({ value: t.toLowerCase(), description: t }));
}

export default class AuctionHouseFilterFeature extends Feature {
	constructor() {
		super("Auction House Filter", "auction");
	}

	isEnabled() {
		return settings.pages.auction.filter;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await enableFilter();
	}

	cleanup() {
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.auction.filter"];
	}
}
