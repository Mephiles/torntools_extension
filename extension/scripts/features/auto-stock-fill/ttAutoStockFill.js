"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Auto Fill Stock",
		"companies",
		() => settings.pages.companies.autoStockFill,
		addListener,
		addFillStockBtn,
		() => document.findAll(".tt-fill-stock").forEach((x) => x.remove()),
		{
			storage: ["settings.pages.companies.autoStockFill"],
		}
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_STOCK_PAGE].push(async () => {
			if (!feature.enabled) return;

			await addFillStockBtn(true);
		});
	}

	async function addFillStockBtn(add) {
		if (!add && getHashParameters().get("option") !== "stock") return;

		(await requireElement("form[action*='stock']")).find(".order ~ a").insertAdjacentElement(
			"afterend",
			document.newElement({
				type: "button",
				class: "tt-btn tt-fill-stock",
				text: "FILL STOCK",
				events: { click: fillStock },
			})
		);
	}

	async function fillStock() {
		const stockForm = await requireElement("form[action*='stock']");
		const totalCapacity = parseInt(stockForm.find(".storage-capacity .max").dataset.initial);
		const totalSoldDaily = stockForm.find(".stock-list > li.total .sold-daily").textContent.getNumber();
		stockForm.findAll(".stock-list > li:not([class]), .stock-list > li.new").forEach((stockItem) => {
			const onOrder = stockItem.find(".delivery").lastChild.textContent.getNumber();
			const inStock = stockItem.find(".stock").lastChild.textContent.getNumber();
			const soldDaily = stockItem.find(".sold-daily").lastChild.textContent.getNumber();

			const neededStock = ((soldDaily / totalSoldDaily) * totalCapacity - onOrder - inStock).dropDecimals();

			const input = stockItem.find("input");
			input.value = neededStock;
			input.dispatchEvent(new Event("blur"));
		});
	}
})();
