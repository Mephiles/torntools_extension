"use strict";

(async () => {
	if (!getPageStatus().access) return;

	// noinspection JSIncompatibleTypesComparison
	const feature = featureManager.registerFeature(
		"Highlight Cheap Items",
		"item market",
		() => settings.pages.itemmarket.highlightCheapItems !== "",
		initialiseListeners,
		showHighlight,
		removeHighlights,
		{
			storage: ["settings.pages.itemmarket.highlightCheapItems"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function initialiseListeners() {
		addXHRListener(({ detail: { page, xhr, json } }) => {
			if (!feature.enabled()) return;
			if (page !== "imarket") return;

			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (step === "getItems") showHighlight(json);
		});
	}

	async function showHighlight(items) {
		removeHighlights();

		const percentage = 1 - settings.pages.itemmarket.highlightCheapItems / 100;

		if (items) {
			for (const { itemID: id, price } of items) {
				const data = torndata.items[id];
				if (!data) continue;

				const value = data.market_value;
				if (!value) continue;

				if (value * percentage < parseInt(price)) continue;

				requireElement(`.item-market-wrap div[aria-expanded="true"]  li[data-item="${id}"]`).then((item) => item.classList.add("tt-highlight-item"));
			}
		} else {
			await requireElement("div[aria-expanded='true'] .pagination-wrap");
			await requireElement("div[aria-expanded='true'] .pagination-wrap > .ajax-placeholder", { invert: true });

			for (const item of document.findAll(".item-market-wrap div[aria-expanded='true']  li[data-item]")) {
				const data = torndata.items[item.dataset.item];
				if (!data) continue;

				const value = data.market_value;
				if (!value) continue;

				const price = item.find(":scope > [itemid][aria-label]").getAttribute("aria-label").split(": ").last().getNumber();
				if (!price) continue;

				if (value * percentage < price) continue;

				item.classList.add("tt-highlight-item");
			}
		}
	}

	function removeHighlights() {
		document.findAll(".tt-highlight-item").forEach((item) => item.classList.remove("tt-highlight-item"));
	}
})();
