import { isHTMLElement } from "@common/utils/functions/dom.ts";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events.ts";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireDOMContentLoaded, requireElement } from "@common/utils/functions/requires";

export async function setupBazaarPage() {
	await requireDOMContentLoaded();

	addFetchListener(async ({ detail: { page, json, fetch } }) => {
		if (page !== "bazaar") return;

		const step = new URLSearchParams(fetch.url).get("step");
		if (isInternalBazaarItems(step, json)) {
			triggerCustomListener(EVENT_CHANNELS.BAZAAR__LOAD_ITEMS, { data: json });
		}
	});
	void registerScrollContainer();
}

async function registerScrollContainer() {
	const scrollContainer = await requireElement("[class*='itemsContainner___'] > div:not([class]) > div");

	new MutationObserver((mutations) => {
		const nodes = mutations
			.flatMap((mutation) => Array.from(mutation.addedNodes))
			.filter(isHTMLElement)
			.filter((element) => element.className.includes("row___"));
		if (nodes.length <= 0) return;

		triggerCustomListener(EVENT_CHANNELS.BAZAAR__INFINITE_SCROLL);
	}).observe(scrollContainer, { childList: true });
}

export interface TornInternalBazaarItems {
	start: number;
	ID: number;
	list: {
		bazaarID: number;
		armoryID: number;
		itemID: number;
		amount: number;
		timestamp: number;
		price: number;
		sort: number;
		ID: number;
		dmg: number;
		acc: number;
		arm: number;
		type: string;
		type2: string;
		equipSlot: number;
		slotsMap: string;
		changedSlotsMap: string;
		slotsMapMask: string;
		slotsMapMaskHair: string;
		slotsMapBackground: string;
		aan: string;
		name: string;
		plural: string;
		isDual: number;
		isMask: number;
		stealthLevel: number;
		cost: number;
		sell: number;
		maxammo: number;
		ammocost: number;
		ammotype: number;
		info: string;
		effect: string;
		requirement: string;
		rofmin: number;
		rofmax: number;
		hospitaltake: number;
		findchance: number;
		area: number;
		ammo: number;
		accuracy: number;
		damage: number;
		total: number;
		weptype: number;
		upgrades: null;
		averageprice: number;
		medianprice: number;
		dailysales: number;
		armourNotCover: string;
		untradable: number;
		dateAdded: string;
		scary: number;
		coverage: string;
		temp_visible_damage_DELETEME: number;
		equipped: number;
		modelled: string;
		position: string;
		hdri: string;
		position2: string;
		junk: number;
		hidden: number;
		avgSort: number;
		category: string;
		percentage: number;
		isBlockedForBuying: false;
		glow: null;
		glowClass: null;
		bonuses: { class: string }[];
		bonusesAvailable: boolean;
	}[];
	total: 5;
}

export function isInternalBazaarItems(step: string | null, _json: unknown): _json is TornInternalBazaarItems {
	return step === "getBazaarItems";
}
