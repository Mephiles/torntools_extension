import "./highlight-blood-bags.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings, torndata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireContent, requireElement, requireItemsLoaded } from "@/utils/common/functions/requires";
import { ALLOWED_BLOOD, getPage, getPageStatus } from "@/utils/common/functions/torn";

const page = getPage();

function initialiseBloodBags() {
	if (page === "item") {
		const listener = async () => {
			if (!FEATURE_MANAGER.isEnabled(HighlightBloodBagsFeature)) return;

			await highlightBloodBags();
		};

		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(listener);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(listener);
	} else if (page === "factions") {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_ARMORY_TAB].push(async ({ section }) => {
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

			if (hasAPIData() && !item.querySelector(".tt-blood-price")) {
				item.querySelector(".name").appendChild(
					elementBuilder({
						type: "span",
						class: "tt-blood-price",
						text: `${formatNumber(torndata.itemsMap[itemId].value.market_price, { currency: true })}`,
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
