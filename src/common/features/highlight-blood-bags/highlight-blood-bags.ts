import "./highlight-blood-bags.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireContent, requireElement, requireItemsLoaded } from "@common/utils/functions/requires";
import { ALLOWED_BLOOD, getBloodType, getPage, getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const page = getPage();

function initialiseBloodBags() {
	if (page === "item") {
		const listener = async () => {
			if (!FEATURE_MANAGER.isEnabled(HighlightBloodBagsFeature)) return;

			await highlightBloodBags();
		};

		addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, listener);
		addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, listener);
	} else if (page === "factions") {
		addCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, async ({ section }) => {
			if (!FEATURE_MANAGER.isEnabled(HighlightBloodBagsFeature) || section !== "medical") return;

			await highlightBloodBags();
		});
	}
}

async function highlightBloodBags() {
	await requireContent();

	if (page === "item") {
		await requireItemsLoaded();
	} else if (page === "factions") {
		await requireElement("#factions > ul.faction-tabs > li[aria-selected='true']");
		if (getCurrentTab() === "armoury") {
			await requireElement("#armoury-medical > .p10 > .ajax-placeholder", { invert: true });
		} else return;
	}

	const allowedBlood: number[] = ALLOWED_BLOOD[getBloodType()] ?? [];

	for (const item of findAllElements("ul.items-cont[aria-expanded=true] > li[data-category='Medical'], [id='tab=armoury&sub=medical'] .item-list > li")) {
		if (!findElement(".name-wrap, .name", item, true)) continue;
		findElement(".name-wrap, .name", item).classList.remove("good-blood", "bad-blood");

		// Filter out items that aren't blood bags.
		if (page === "item" && !item.dataset.sort.includes("Blood Bag : ")) continue;
		else if (page === "factions" && !findElement(".name", item).textContent.split(" x")[0].includes("Blood Bag : ")) continue;

		const itemId = parseInt(item.dataset.item || findElement(".img-wrap", item).dataset.itemid);
		if (itemId === 1012) continue; // is an irradiated blood bag

		findElement(".name-wrap, .name", item).classList.add(allowedBlood.includes(itemId) ? "good-blood" : "bad-blood");

		if (page === "factions") {
			if (findElement(".tt-item-price", item, true)) findElement(".tt-item-price", item).remove();

			if (ITEM_RESOLVER.hasFullItems() && !findElement(".tt-blood-price", item, true)) {
				findElement(".name", item).appendChild(
					elementBuilder({
						type: "span",
						class: "tt-blood-price",
						text: formatNumber(ITEM_RESOLVER.getFullItem(itemId).value.market_price, { currency: true }),
					}),
				);
			}
		}
	}
}

function getCurrentTab() {
	return findElement("#factions > ul.faction-tabs > li[aria-selected='true']").getAttribute("data-case").replace("faction-", "");
}

export default class HighlightBloodBagsFeature extends Feature {
	constructor() {
		super("Highlight Blood Bags", "items");
	}

	override precondition() {
		return getPageStatus().access && !(page === "factions" && !isInternalFaction);
	}

	override isEnabled() {
		return settings.pages.items.highlightBloodBags !== "none";
	}

	override initialise() {
		initialiseBloodBags();
	}

	override async execute() {
		await highlightBloodBags();
	}

	override storageKeys() {
		return ["settings.pages.items.highlightBloodBags"];
	}
}
