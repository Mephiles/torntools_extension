(async () => {
	if (!getPageStatus().access) return;

	const page = getPage();

	const feature = featureManager.registerFeature(
		"Casino Net Total",
		"casino",
		() => settings.pages.casino.netTotal,
		initialiseListener,
		addTotal,
		removeTotal,
		{
			storage: ["settings.pages.casino.netTotal"],
		},
		null
	);

	function initialiseListener() {
		if (isBookie()) {
			window.addEventListener("hashchange", () => {
				if (feature.enabled() && location.hash.includes("stats/")) {
					addTotal();
				}
			});
		}
	}

	async function addTotal() {
		if (isBookie() && !location.hash.includes("stats/")) return;

		for (const statsType of ["overall", "your"]) {
			if (statsType === "overall" && hasOnlyPersonalStats()) continue;

			await requireElement(`#${statsType}-stats .stat-value`);
			const moneyElementsList = document.evaluate(
				`//div[contains(@id,"${statsType}-stats")]
					//li
						[
							(contains(text(), "Total money won") or contains(text(), "Total money gain"))
							or
							(contains(text(), "Total money lost") or contains(text(), "Total money loss"))
						]
							/following-sibling::li[(contains(@class, "stat-value"))]`,
				document,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
			if (moneyElementsList.snapshotLength !== 2) continue;
			const totalWon = parseInt(moneyElementsList.snapshotItem(0).textContent.replace(/[$, ]/g, ""));
			const totalLostElement = moneyElementsList.snapshotItem(1);
			if (!isElement(totalLostElement)) return;

			const totalLost = parseInt(totalLostElement.textContent.replace(/[$, ]/g, ""));

			if (document.find(`.${statsType}-stats-wrap .tt-net-total`)) return;

			await requireElement(`.stats-wrap .${statsType}-stats-wrap .stat`);
			totalLostElement.closest("li:not(.stat-value)").insertAdjacentElement(
				"afterend",
				elementBuilder({
					type: "ul",
					class: ["tt-net-total", isBookie() ? "bookie" : null, isPoker() ? "poker" : null],
					children: [
						elementBuilder({ type: "li", class: "name", text: "Net total" }),
						elementBuilder({ type: "li", class: "value", text: formatNumber(totalWon - totalLost, { currency: true }) }),
					],
				})
			);
		}

		function hasOnlyPersonalStats() {
			return ["russianroulettestatistics", "holdemstats"].includes(page);
		}

		function isPoker() {
			return page === "holdemstats";
		}
	}

	function isBookie() {
		return page === "bookie";
	}

	function removeTotal() {
		findAllElements(".tt-net-total").forEach((x) => x.remove());
	}
})();
