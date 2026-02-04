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

			return true;
		}
	);

	async function showValue() {
		await requireSidebar();

		const block = document.evaluate(
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
		if (!block || !isElement(block)) {
			console.warn("Couldn't find your points block for some odd reason.");
			return;
		}

		block.classList.add("tt-points-value");

		const value = torndata.stats.points_averagecost;
		const points = convertToNumber(block.querySelector("span[class*='value___']").textContent);

		block.addEventListener("mouseover", () => {
			for (const elements of findAllElements(":scope > span", block))
				elements.setAttribute(
					"title",
					`${formatNumber(value, { currency: true })} | ${formatNumber(points)}x = ${formatNumber(value * points, {
						currency: true,
						shorten: 2,
					})}`
				);
		});

		executeScript(chrome.runtime.getURL("scripts/features/points-value/ttPointsValue.inject.js"));
	}

	function removeValue() {
		const block = document.querySelector(".tt-points-value");
		if (!block) return;

		block.classList.remove("tt-points-value");
		for (const elements of findAllElements(":scope > span", block)) elements.removeAttribute("title");
	}

	return true;
})();
