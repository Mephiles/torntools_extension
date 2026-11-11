import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./item-market-price-suggestion.module.css";

type MarketResponse = { itemmarket?: { listings?: { price: number }[] } };
const ROW_SELECTOR = "div[class*='itemRowWrapper']";
const INPUT_SELECTOR = "div[class*='priceInputWrapper'] input.input-money:not([type='hidden'])";

function addButtons() {
	for (const row of findAllElements(ROW_SELECTOR)) {
		const input = findElement<HTMLInputElement>(INPUT_SELECTOR, row, true);
		if (!input || findElement(`.${styles.priceButton}`, row, true)) continue;
		const image = findElement<HTMLImageElement>("img", row, true);
		const itemId = image?.src.match(/\/images\/items\/(\d+)\//)?.[1];
		if (!itemId || image?.parentElement?.matches("[class*='glow-']")) continue;
		const button = document.createElement("button");
		button.type = "button";
		button.className = styles.priceButton;
		button.textContent = "Suggest price";
		button.title = "Fill the lowest market price minus your configured offset";
		button.addEventListener("click", async () => {
			if (input.value.trim()) {
				button.title = "Clear the price first to use a suggestion.";
				return;
			}
			button.disabled = true;
			button.textContent = "Loading…";
			try {
				const response = await fetchData<MarketResponse>("tornv2", {
					section: "market",
					id: itemId,
					selections: ["itemmarket"],
					relay: true,
					silent: true,
				});
				const prices = (response.itemmarket?.listings ?? [])
					.map((listing) => listing.price)
					.filter((price) => Number.isSafeInteger(price) && price > 0);
				if (!prices.length) throw new Error("No market listings available");
				if (input.isConnected && !input.value.trim() && image?.src.match(/\/images\/items\/(\d+)\//)?.[1] === itemId) {
					const offset = Math.max(0, Math.floor(settings.pages.itemmarket.priceSuggestionOffset));
					updateReactInput(input, Math.max(1, Math.min(...prices) - offset));
				}
				button.textContent = "Suggest price";
			} catch {
				button.textContent = "Price unavailable";
				button.title = "Could not load market prices. Click to retry.";
			} finally {
				button.disabled = false;
			}
		});
		input.parentElement?.appendChild(button);
	}
}

export default class ItemMarketPriceSuggestionFeature extends Feature {
	constructor() {
		super("Item Market Price Suggestion", "item market");
	}

	override isEnabled() {
		return settings.pages.itemmarket.priceSuggestion;
	}

	override storageKeys() {
		return ["settings.pages.itemmarket.priceSuggestion"];
	}

	override requirements() {
		return hasAPIData() || "No API access.";
	}

	override execute() {
		addButtons();
		new MutationObserver(addButtons).observe(document.body, { childList: true, subtree: true });
	}
}
