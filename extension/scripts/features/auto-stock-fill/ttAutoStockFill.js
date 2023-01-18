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
		const storageCapacity = [...stockForm.findAll(".storage-capacity > *")].map(x => x.dataset.initial.getNumber());
		const usableCapacity = storageCapacity[1] - storageCapacity[0];
		const totalSoldDaily = stockForm.find(".stock-list > li.total .sold-daily").textContent.getNumber();
		console.log(storageCapacity, usableCapacity, totalSoldDaily);

		stockForm.findAll(".stock-list > li:not(.total):not(.quantity)").forEach((stockItem) => {
			const soldDaily = stockItem.find(".sold-daily").lastChild.textContent.getNumber();

			// Original
			// let neededStock = (((soldDaily / totalSoldDaily) * totalCapacity) - stock - ordered).dropDecimals();

			let neededStock = (((soldDaily / totalSoldDaily) * usableCapacity)).dropDecimals();
			neededStock = Math.max(0, neededStock);

			console.log(soldDaily, neededStock);

			updateReactInput(stockItem.find("input"), neededStock, { version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT });
		});
	}
})();
