(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Hide Stocks",
		"stocks",
		() => settings.hideStocks.length > 0,
		null,
		hideStocks,
		unhideStocks,
		{
			storage: ["settings.hideStocks"],
		},
		null
	);

	async function hideStocks() {
		await requireElement("#stockmarketroot [class*='stock___'][id]");
		unhideStocks();
		findAllElements("#stockmarketroot [class*='stock___'][id]").forEach((stockNode) => {
			if (settings.hideStocks.some((x) => x === stockNode.getAttribute("id"))) stockNode.classList.add("tt-hidden");
		});
		document
			.find("#stockmarketroot [class*='appHeaderWrapper__']")
			.insertAdjacentElement("afterend", createMessageBox("Some stocks have been hidden.", { class: "tt-stocks-hidden" }));
	}

	function unhideStocks() {
		findAllElements("#stockmarketroot .tt-hidden[class*='stock___'][id]").forEach((stockNode) => stockNode.classList.remove("tt-hidden"));
		const ttMessage = document.find(".tt-stocks-hidden");
		if (ttMessage) ttMessage.remove();
	}
})();
