"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

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

	let pointsBlock = null;
	let pointsObserver = null;

	async function showValue() {
		await requireSidebar();

		pointsBlock = document.evaluate(
			`
				(
					//a[@id='pointsPoints']
					| 
					//div[@id='sidebarroot']
						//span[contains(@class, 'name___')][contains(., 'Points')]
				)
					/parent::p[contains(@class, 'point-block___')]
			`,
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		)?.singleNodeValue;
		if (!pointsBlock) {
			console.warn("Couldn't find your points block for some odd reason.");
			return;
		}

		pointsBlock.classList.add("tt-points-value");

		pointsObserver = new MutationObserver(updateValue);
		pointsObserver.observe(pointsBlock.find("span[class*='value___']"), { characterData: true, childList: true, subtree: true });

		updateValue(pointsBlock);

		executeScript((wrapped) => wrapped.initializeTooltip(".tt-points-value", "white-tooltip"), "initializeTooltip('.tt-points-value', 'white-tooltip')");
	}

	function updateValue(block) {
		const value = torndata.stats.points_averagecost;
		const points = pointsBlock.find("span[class*='value___']").textContent.getNumber();

		for (const elements of pointsBlock.findAll(":scope > span"))
			elements.setAttribute(
				"title",
				`${formatNumber(value, { currency: true })} | ${formatNumber(points)}x = ${formatNumber(value * points, {
					currency: true,
					shorten: 2,
				})}`
			);
	}

	function removeValue() {
		const block = document.find(".tt-points-value");
		if (!block) return;

		pointsObserver.disconnect();

		block.classList.remove("tt-points-value");
		for (const elements of block.findAll(":scope > span")) elements.removeAttribute("title");
	}
})();
