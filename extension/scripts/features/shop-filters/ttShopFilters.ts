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
			return true;
		}
	);

	type ShopFilterId = "hideLoss" | "hideUnder100";

	type LocalFilters = {
		filters?: {
			getSelections: () => ShopFilterId[];
		};
	};

	const localFilters: LocalFilters = {};

	async function addFilters() {
		const title = (await requireElement(".buy-items-wrap > [role*='heading']")) as HTMLElement;

		const shopFilters = createCheckboxList({
			items: [
				{ id: "hideLoss", description: mobile || tablet ? "Only profit" : "Hide items with loss" },
				{ id: "hideUnder100", description: mobile || tablet ? "Enough stock" : "Hide items under 100 stock" },
			],
			orientation: "row",
		});

		shopFilters.setSelections([...(filters.shops.hideLoss ? ["hideLoss"] : []), ...(filters.shops.hideUnder100 ? ["hideUnder100"] : [])]);

		shopFilters.onSelectionChange(filtering);
		localFilters.filters = { getSelections: shopFilters.getSelections as () => ShopFilterId[] };

		void filtering();

		title.appendChild(
			elementBuilder({
				type: "div",
				class: "tt-shop-filters tt-theme",
				children: [shopFilters.element],
			})
		);
	}

	async function filtering() {
		await requireElement(".item-desc");

		const checkboxes = localFilters.filters?.getSelections() ?? [];
		const hideLoss = checkboxes.includes("hideLoss");
		const hideUnder100 = checkboxes.includes("hideUnder100");

		await ttStorage.change({ filters: { shops: { hideLoss, hideUnder100 } } });

		for (const element of findAllElements(".buy-items-wrap .items-list > li:not(.empty, .clear)")) {
			const itemElement = element.find(".item");
			const itemIdAttr = itemElement.getAttribute("itemid");
			if (!itemIdAttr) continue;

			const id = itemIdAttr.getNumber();
			const item = torndata.items[id];
			if (!item) continue;

			const priceText = element.find(".price").firstChild?.textContent ?? "";
			const price = priceText.getNumber();

			const profitable = item.market_value - price > 0;
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
		findAllElements(".tt-shop-filters").forEach((x) => x.remove());
		findAllElements(".buy-items-wrap .items-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
