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
		async () => {
			if (!hasAPIData()) return "No API access.";

			await checkDevice();
		}
	);

	const localFilters = {};

	async function addFilters() {
		const title = await requireElement(".buy-items-wrap > [role*='heading']");

		const shopFilters = createCheckboxList({
			items: [
				{ id: "hideLoss", description: mobile || tablet ? "Only profit" : "Hide items with loss" },
				{ id: "hideUnder100", description: mobile || tablet ? "Enough stock" : "Hide items under 100 stock" },
			],
			orientation: "row",
		});
		shopFilters.setSelections([...(filters.shops.hideLoss ? ["hideLoss"] : []), ...(filters.shops.hideUnder100 ? ["hideUnder100"] : [])]);

		shopFilters.onSelectionChange(filtering);
		localFilters.filters = { getSelections: shopFilters.getSelections };

		filtering().then(() => {});

		title.appendChild(
			document.newElement({
				type: "div",
				class: "tt-shop-filters tt-theme",
				children: [shopFilters.element],
			})
		);
	}

	async function filtering() {
		await requireElement(".item-desc");

		const checkboxes = localFilters.filters.getSelections();
		const hideLoss = checkboxes.includes("hideLoss");
		const hideUnder100 = checkboxes.includes("hideUnder100");

		await ttStorage.change({ filters: { shops: { hideLoss, hideUnder100 } } });

		for (const element of document.findAll(".buy-items-wrap .items-list > li:not(.empty, .clear)")) {
			const id = element.find(".item").getAttribute("itemid").getNumber();
			const profitable = torndata.items[id].market_value - element.find(".price").firstChild.textContent.getNumber() > 0;
			if (hideLoss && !profitable) {
				element.classList.add("tt-hidden");
				continue;
			}

			if (hideUnder100 && element.find(".instock").textContent.getNumber() < 100) {
				element.classList.add("tt-hidden");
				continue;
			}

			element.classList.remove("tt-hidden");
		}
	}

	function removeFilters() {
		document.findAll(".tt-shop-filters").forEach((x) => x.remove());
		document.findAll(".buy-items-wrap .items-list > li.hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
