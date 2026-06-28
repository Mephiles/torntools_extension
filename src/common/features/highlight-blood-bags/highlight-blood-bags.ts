import "./highlight-blood-bags.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireContent, requireElement, requireItemsLoaded } from "@common/utils/functions/requires";
import { ALLOWED_BLOOD, getPage, getPageStatus } from "@common/utils/functions/torn";
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

	const allowedBlood: number[] = ALLOWED_BLOOD[settings.pages.items.highlightBloodBags];

	for (const item of findAllElements("ul.items-cont[aria-expanded=true] > li[data-category='Medical'], [id='tab=armoury&sub=medical'] .item-list > li")) {
		if (!item.querySelector(".name-wrap, .name")) continue;
		item.querySelector(".name-wrap, .name").classList.remove("good-blood", "bad-blood");

		// Filter out items that aren't blood bags.
		if (page === "item" && !item.dataset.sort.includes("Blood Bag : ")) continue;
		else if (page === "factions" && !item.querySelector(".name").textContent.split(" x")[0].includes("Blood Bag : ")) continue;

		const itemId = parseInt(item.dataset.item || item.querySelector<HTMLElement>(".img-wrap").dataset.itemid);
		if (itemId === 1012) continue; // is an irradiated blood bag

		item.querySelector(".name-wrap, .name").classList.add(allowedBlood.includes(itemId) ? "good-blood" : "bad-blood");

		if (page === "factions") {
			if (item.querySelector(".tt-item-price")) item.querySelector(".tt-item-price").remove();

			if (ITEM_RESOLVER.hasFullItems() && !item.querySelector(".tt-blood-price")) {
				item.querySelector(".name").appendChild(
					elementBuilder({
						type: "span",
						class: "tt-blood-price",
						text: `${formatNumber(ITEM_RESOLVER.getFullItem(itemId).value.market_price, { currency: true })}`,
					}),
				);
			}
		}
	}
}

function getCurrentTab() {
	return document.querySelector("#factions > ul.faction-tabs > li[aria-selected='true']").getAttribute("data-case").replace("faction-", "");
}

async function removeHighlights() {
	for (const highlight of findAllElements(".good-blood, .bad-blood")) {
		highlight.classList.remove("good-blood", "bad-blood");

		const price = highlight.querySelector(".tt-item-price");
		if (price) price.remove();
	}
}

export default class HighlightBloodBagsFeature extends Feature {
	constructor() {
		super("Highlight Blood Bags", "items");
	}

	precondition() {
		return getPageStatus().access && !(page === "factions" && !isInternalFaction);
	}

	isEnabled() {
		return settings.pages.items.highlightBloodBags !== "none";
	}

	initialise() {
		initialiseBloodBags();
	}

	async execute() {
		await highlightBloodBags();
	}

	async cleanup() {
		await removeHighlights();
	}

	storageKeys() {
		return ["settings.pages.items.highlightBloodBags"];
	}
}
