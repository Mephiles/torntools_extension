(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Auto Fill Stock",
		"companies",
		() => settings.pages.companies.autoStockFill,
		addListener,
		addFillStockButton,
		() => findAllElements(".tt-fill-stock").forEach((x) => x.remove()),
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

	async function addFillStockButton(add: boolean) {
		if (!add && getHashParameters().get("option") !== "stock") return;

		(await requireElement("form[action*='stock'] .order ~ a")).insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "div",
				class: "tt-fill-stock-wrapper",
				children: [elementBuilder({ type: "button", class: "tt-btn tt-fill-stock", text: "FILL STOCK", events: { click: fillStock } })],
			})
		);
	}

	async function fillStock() {
		const stockForm: Element = await requireElement("form[action*='stock']");
		const storageCapacity = findAllElements(".storage-capacity > *", stockForm).map((x) => x.dataset.initial.getNumber());
		const usableCapacity = storageCapacity[1] - storageCapacity[0];
		const totalSoldDaily = stockForm.find(".stock-list > li.total .sold-daily").textContent.getNumber();
		console.log(storageCapacity, usableCapacity, totalSoldDaily);

		findAllElements(".stock-list > li:not(.total):not(.quantity)", stockForm).forEach((stockItem) => {
			const soldDaily = stockItem.find(".sold-daily").lastChild.textContent.getNumber();

			// Original
			// let neededStock = (((soldDaily / totalSoldDaily) * totalCapacity) - stock - ordered).dropDecimals();

			let neededStock = ((soldDaily / totalSoldDaily) * usableCapacity).dropDecimals();
			neededStock = Math.max(0, neededStock);

			console.log(soldDaily, neededStock);

			updateReactInput(stockItem.find("input"), neededStock, { version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT });
		});
	}
})();
