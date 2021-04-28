"use strict";

(async () => {
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
		async () => {
			await requireElement("[class*='stockMarket__'] ul[class*='stock__'] [class*='nameContainer__']");
		}
	);

	function addAcronyms() {
		for (const stockName of document.findAll("[class*='stockMarket__'] ul[class*='stock__'] [class*='stockName__']")) {
			stockName.find("[class*='nameContainer__']").classList.add("tt-stock-name");
			stockName.appendChild(document.newElement({
				type: "span",
				id: "tt-acronym",
				text: `(${stockName.find("[class*='logoContainer__'] img").src.split("/").last().split(".")[0]})`;
			}))
		}
	}

	function removeAcronyms() {
		document.findAll("[class*='stockMarket__'] #tt-stock-name[class*='nameContainer__']").forEach((x) => x.id = x.id.replaceAll("tt-stock-name", ""));
		document.findAll("#tt-acronym").forEach((x) => x.remove());
	}
})();
