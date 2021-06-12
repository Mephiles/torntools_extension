"use strict";

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

			container.classList.add("tt-acronym-container");
			container.insertAdjacentElement(
				"afterbegin",
				document.newElement({
					type: "span",
					id: "tt-acronym",
					text: `(${stockName.find("[class*='logoContainer__'] img").src.split("/").last().split(".")[0]}) `,
				})
			);
		}
	}

	function removeAcronyms() {
		document.findAll("#tt-acronym").forEach((x) => x.remove());
	}
})();
