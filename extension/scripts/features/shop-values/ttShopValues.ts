(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Shop Values",
		"shops",
		() => settings.pages.shops.values,
		initialiseListeners,
		showValues,
		removeValues,
		{
			storage: ["settings.pages.shops.values"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	function initialiseListeners() {
		addXHRListener(({ detail: { page, xhr } }) => {
			if (!feature.enabled()) return;

			if (page !== "shops") return;

			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");
			if (step !== "loadNextShopChunk") return;

			void showValues();
		});
	}

	async function showValues() {
		await requireElement(".sell-items-list > li:not(.tt-value-modified)");

		document.findAll(".sell-items-list > li:not(.tt-value-modified)").forEach((row) => {
			row.classList.add("tt-value-modified");

			const id = parseInt(row.dataset.item);
			const { market_value } = torndata.items[id];

			row.find(".desc")!.appendChild(
				document.newElement({
					type: "span",
					class: "tt-market-value",
					text: formatNumber(market_value, { currency: true }),
				})
			);
		});
	}

	function removeValues() {
		document.findAll(".tt-value-modified").forEach((element) => element.classList.remove("tt-value-modified"));
		document.findAll(".tt-market-value").forEach((element) => element.remove());
	}
})();
