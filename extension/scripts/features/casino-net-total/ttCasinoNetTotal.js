"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const page = getPage();

	if (page === "loader") {
		const sid = getSearchParameters().get("sid");

		if (["viewLotteryStats"].includes(sid)) {
			return;
		}
	}

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
			if (statsType === "overall" && isPoker()) continue;

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
			const totalLost = parseInt(totalLostElement.textContent.replace(/[$, ]/g, ""));

			if (document.find(`.${statsType}-stats-wrap .tt-net-total`)) return;

			await requireElement(`.stats-wrap .${statsType}-stats-wrap .stat`);
			totalLostElement.closest("li:not(.stat-value)").insertAdjacentElement(
				"afterend",
				document.newElement({
					type: "ul",
					class: `tt-net-total ${isBookie(true) ? "bookie" : ""}`,
					children: [
						document.newElement({ type: "li", class: "name", text: "Net total" }),
						document.newElement({ type: "li", class: "value", text: formatNumber(totalWon - totalLost, { currency: true }) }),
					],
				})
			);
		}

		function isPoker() {
			return page === "loader" && getSearchParameters().get("sid") === "viewPokerStats";
		}
	}

	function isBookie(beta = false) {
		return (!beta && page === "bookies") || page === "bookie";
	}

	function removeTotal() {
		document.findAll(".tt-net-total").forEach((x) => x.remove());
	}
})();
