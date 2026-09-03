import "./shop-values.css";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addXHRListener(({ detail: { page, xhr } }) => {
		if (!FEATURE_MANAGER.isEnabled(ShopValuesFeature)) return;

		if (page !== "shops") return;

		const params = new URLSearchParams(xhr.requestBody);
		const step = params.get("step");
		if (step !== "loadNextShopChunk") return;

		void showValues();
	});
}

async function showValues() {
	await requireElement(".sell-items-list > li:not(.tt-value-modified), .sell-items-wrap .no-items[style*='block']");

	findAllElements(".sell-items-list > li:not(.tt-value-modified)").forEach((row) => {
		row.classList.add("tt-value-modified");

		const id = parseInt(row.dataset.item!);

		const resolvedItem = ITEM_RESOLVER.getFullItem(id);
		if (!resolvedItem) return;

		const value = resolvedItem.value.market_price;

		findElement(".desc", row).appendChild(
			elementBuilder({
				type: "span",
				class: "tt-market-value",
				text: formatNumber(value, { currency: true }),
			}),
		);
	});
}

export default class ShopValuesFeature extends Feature {
	constructor() {
		super("Shop Values", "shops");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!ITEM_RESOLVER.hasFullItems()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.shops.values;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await showValues();
	}

	override storageKeys() {
		return ["settings.pages.shops.values"];
	}
}
