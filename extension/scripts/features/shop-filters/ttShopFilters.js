"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Shop Filters",
		"shops",
		() => settings.pages.shops.filters,
		null,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.shops.filters"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	const localFilters = {};
	async function addFilters() {
		const title = await requireElement(".buy-items-wrap > [role*='heading']");

		const shopFilters = createCheckboxList({
			items: [
				{ id: "hideLoss", description: "Hide items with loss" },
				{ id: "hideUnder100", description: "Hide items under 100 stock" },
			],
			orientation: "row",
		});
		shopFilters.setSelections([ ...filters.shops.hideLoss ? ["hideLoss"] : [], ...filters.shops.hideUnder100 ? ["hideUnder100"] : [] ]);

		shopFilters.onSelectionChange(filtering);
		localFilters.filters = { getSelections: shopFilters.getSelections };

		filtering();

		title.appendChild(
			document.newElement({
				type: "div",
				class: "tt-shop-filters tt-theme",
				children: [ shopFilters.element ],
			})
		);
	}

	async function filtering() {
		await requireElement(".item-desc");

		const checkboxes = localFilters.filters.getSelections();
		const hideLoss = checkboxes.includes("hideLoss");
		const hideUnder100 = checkboxes.includes("hideUnder100");

		await ttStorage.change({ filters: { shops: { hideLoss, hideUnder100 } } });

		for (const li of document.findAll(".buy-items-wrap .items-list > li:not(.empty, .clear)")) {
			li.classList.remove("hidden");

			const liItemID = li.find(".item").getAttribute("itemid").getNumber();
			const profitable = (torndata.items[liItemID].market_value - li.find(".price").firstChild.textContent.getNumber()) > 0;
			if (hideLoss && !profitable) {
				li.classList.add("hidden");
				continue;
			}

			if (hideUnder100 && li.find(".instock").textContent.getNumber() < 100) {
				li.classList.add("hidden");
				continue;
			}
		};
	}

	function removeFilters() {
		document.findAll(".tt-shop-filters").forEach(x => x.remove());
		document.findAll(".buy-items-wrap .items-list > li.hidden").forEach(x => x.classList.remove("hidden"));
	}
})();
