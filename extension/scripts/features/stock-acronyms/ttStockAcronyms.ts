(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Stock Acronyms",
		"stocks",
		() => settings.pages.stocks.acronyms,
		null,
		addAcronyms,
		removeAcronyms,
		{
			storage: ["settings.pages.stocks.acronyms"],
		},
		null
	);

	async function addAcronyms() {
		await requireElement("[class*='stockMarket__'] ul[class*='stock__'] [class*='nameContainer__']");

		for (const stockName of document.findAll("[class*='stockMarket__'] ul[class*='stock__'] [class*='stockName__']")) {
			const container = stockName.find("[class*='nameContainer__']");

			const id = stockName.closest("[class*='stock___']").id;
			if (typeof stockdata[id] === "number") continue;

			const acronym = stockdata[id].acronym;

			container.classList.add("tt-acronym-container");
			container.insertAdjacentElement(
				"afterbegin",
				document.newElement({ type: "span", class: "tt-acronym", text: `(${acronym}) `, dataset: { acronym } })
			);
		}
	}

	function removeAcronyms() {
		document.findAll(".tt-acronym").forEach((x) => x.remove());
	}
})();
