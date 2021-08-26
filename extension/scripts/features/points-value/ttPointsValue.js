"use strict";

(async () => {
	if ((await checkDevice()).mobile) return "Not supported on mobile!";

	featureManager.registerFeature(
		"Points Value",
		"sidebar",
		() => settings.pages.sidebar.pointsValue,
		null,
		showValue,
		removeValue,
		{ storage: ["settings.pages.sidebar.pointsValue"] },
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	async function showValue() {
		await requireSidebar();

		const block = document.find("#pointsPoints").parentElement;

		block.classList.add("tt-points-value");

		const value = torndata.stats.points_averagecost;
		const points = block.find("span[class*='value___']").textContent.getNumber();

		for (const elements of block.findAll(":scope > span"))
			elements.setAttribute(
				"title",
				`${formatNumber(value, { currency: true })} | ${formatNumber(points)}x = ${formatNumber(value * points, { currency: true, shorten: 2 })}`
			);

		executeScript((wrapped) => wrapped.initializeTooltip(".tt-points-value", "white-tooltip"), "initializeTooltip('.tt-points-value', 'white-tooltip')");
	}

	function removeValue() {
		const block = document.find(".tt-points-value");
		if (!block) return;

		block.classList.remove("tt-points-value");
		for (const elements of block.findAll(":scope > span")) elements.removeAttribute("title");
	}
})();
