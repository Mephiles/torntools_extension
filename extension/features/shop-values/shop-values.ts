import "./shop-values.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { settings, torndata } from "@/utils/common/data/database";
import { formatNumber } from "@/utils/common/functions/formatting";
import { getPageStatus } from "@/utils/common/functions/torn";
import { hasAPIData } from "@/utils/common/functions/api";

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
	await requireElement(".sell-items-list > li:not(.tt-value-modified)");

	findAllElements(".sell-items-list > li:not(.tt-value-modified)").forEach((row) => {
		row.classList.add("tt-value-modified");

		const id = parseInt(row.dataset.item);
		const value = torndata.itemsMap[id].value.market_price;

		row.querySelector(".desc")!.appendChild(
			elementBuilder({
				type: "span",
				class: "tt-market-value",
				text: formatNumber(value, { currency: true }),
			})
		);
	});
}

function removeValues() {
	findAllElements(".tt-value-modified").forEach((element) => element.classList.remove("tt-value-modified"));
	findAllElements(".tt-market-value").forEach((element) => element.remove());
}

export default class ShopValuesFeature extends Feature {
	constructor() {
		super("Shop Values", "shops");
	}
	
	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}
	
	isEnabled() {
		return settings.pages.shops.values;
	}

	initialise() {
		initialiseListeners();
	}
	
	async execute() {
		await showValues();
	}
	
	cleanup() {
		removeValues();
	}
	
	storageKeys() {
		return ["settings.pages.shops.values"];
	}
}
