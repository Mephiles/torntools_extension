"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Auto Fill Stock",
		"companies",
		() => settings.pages.companies.autoStockFill,
		addListener,
		addFillStockButton,
		() => document.findAll(".tt-fill-stock").forEach((x) => x.remove()),
		{
			storage: ["settings.pages.companies.autoStockFill"],
		},
		undefined,
		{ liveReload: true }
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_STOCK_PAGE].push(async () => {
			if (!feature.enabled) return;

			await addFillStockButton(true);
		});
	}

	async function addFillStockButton(add) {
		if (!add && getHashParameters().get("option") !== "stock") return;

		(await requireElement("form[action*='stock'] .order ~ a")).insertAdjacentElement(
			"afterend",
			document.newElement({
				type: "div",
				class: "tt-fill-stock-wrapper",
				children: [document.newElement({ type: "button", class: "tt-btn tt-fill-stock", text: "FILL STOCK", events: { click: fillStock } })],
			})
		);
	}

	async function fillStock() {
		const stockForm = await requireElement("form[action*='stock']");
		const totalCapacity = stockForm.find(".storage-capacity .max").dataset.initial.getNumber();
		const totalSoldDaily = stockForm.find(".stock-list > li.total .sold-daily").textContent.getNumber();

		stockForm.findAll(".stock-list > li:not([class]), .stock-list > li.new").forEach((stockItem) => {
			const ordered = stockItem.find(".delivery").lastChild.textContent.getNumber();
			const stock = stockItem.find(".stock").lastChild.textContent.getNumber();
			const soldDaily = stockItem.find(".sold-daily").lastChild.textContent.getNumber();

			const neededStock = ((soldDaily / totalSoldDaily) * totalCapacity - ordered - stock).dropDecimals();

			updateReactInput(stockItem.find("input"), neededStock, REACT_UPDATE_VERSIONS.DEFAULT);
		});
	}
})();
