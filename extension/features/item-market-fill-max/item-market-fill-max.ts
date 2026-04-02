import "./item-market-fill-max.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus, updateReactInput } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { findAllElements, mobile, tablet } from "@/utils/common/functions/dom";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";

function addListener() {
	document.addEventListener("click", (event) => {
		const target = event.target as Element;
		if (!target || !target.matches("[class*='rowWrapper__'] [class*='available__']")) return;

		if (!FEATURE_MANAGER.isEnabled(ItemMarketFillMaxFeature)) return;

		const listing = target.closest("li");
		// The purchase amount input is not visible in mobiles and tablets until
		// the Buy icon is clicked. Hence exit early.
		if ((mobile || tablet) && !listing.children[0].matches("[class*='sellerRow__'][class*='expanded__']")) return;

		const quantityAvailable = convertToNumber(listing.querySelector("[class*='available__']").textContent);
		const moneyOnHand = convertToNumber(document.querySelector<HTMLElement>("#user-money").dataset.money);
		const itemPrice = convertToNumber(listing.querySelector("[class*='price__']").textContent);
		const purchasableQuantity = Math.min(quantityAvailable, Math.floor(moneyOnHand / itemPrice));

		const quantityInput = listing.querySelector<HTMLInputElement>(".input-money-group input:not([type])");
		updateReactInput(quantityInput, purchasableQuantity);
	});
}

async function addButton() {
	const itemMarketRoot = await requireElement("#item-market-root");

	itemMarketRoot.classList.add("tt-show-fill-max");
}

function removeButton() {
	findAllElements(".tt-show-fill-max").forEach((x) => x.classList.remove("tt-show-fill-max"));
}

export default class ItemMarketFillMaxFeature extends Feature {
	constructor() {
		super("Item Market Fill Max", "item market");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.itemmarket.fillMax;
	}

	initialise() {
		addListener();
	}

	async execute() {
		await addButton();
	}

	cleanup() {
		removeButton();
	}

	storageKeys() {
		return ["settings.pages.itemmarket.fillMax"];
	}
}
