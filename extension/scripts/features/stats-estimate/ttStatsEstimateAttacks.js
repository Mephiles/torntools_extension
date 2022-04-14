"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isOwnProfile()) return;

	const statsEstimate = new StatsEstimate(false);
	featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.attacks,
		null,
		showEstimate,
		removeEstimate,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.attacks"],
		},
		async () => {
			if (!hasAPIData()) return "No API access.";

			await checkDevice();
		}
	);

	async function showEstimate() {
		await requireElement("div[class*='textEntries___']");

		handleDefender();
		handleAttacker();

		function handleDefender() {
			const id = parseInt(getSearchParameters().get("user2ID"));

			statsEstimate
				.fetchEstimate(id)
				.then((estimate) => createElement(estimate, true, "defender"))
				.catch(() => {});
		}

		function handleAttacker() {
			if (settings.apiUsage.user.battlestats) {
				createElement(userdata.total, false, "attacker");
			} else if (settings.apiUsage.user.personalstats && settings.apiUsage.user.crimes) {
				const {
					rank,
					level,
					criminalrecord: { total: crimes },
					personalstats: { networth },
					last_action: { timestamp: lastAction },
					player_id: id,
				} = userdata;

				const estimate = statsEstimate.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);

				createElement(estimate, true, "attacker");
			}
		}

		function createElement(estimate, isEstimate = true, side) {
			let text;
			if (isEstimate) {
				text = mobile ? `Estimate: ${estimate.replace("under ", "<").replace("over ", ">")}` : `Stats Estimate: ${estimate}`;
			} else if (!isNaN(estimate)) {
				text = mobile ? `Stats: ${formatNumber(estimate, { shorten: 3, decimals: 1 })}` : `Battle Stats: ${formatNumber(estimate, { shorten: true })}`;
			} else throw "Not a correct estimate!";

			let entries;
			if (mobile || tablet) {
				if (side === "attacker") entries = document.find("div[class*='boxTitle___']:first-child div[class*='textEntries___']");
				else if (side === "defender") entries = document.find("div[class*='boxTitle___']:nth-child(2) div[class*='textEntries___']");
			} else entries = document.find(`#${side} div[class*='textEntries___']`);

			entries.classList.add("tt-stats-estimate-attacks-wrapper");
			entries.insertAdjacentElement("afterbegin", document.newElement({ type: "div", class: "tt-stats-estimate-attacks", text }));
		}
	}

	function removeEstimate() {
		document.findAll(".tt-stats-estimate-attacks").forEach((estimate) => estimate.remove());
		document.findAll(".tt-stats-estimate-attacks-wrapper").forEach((wrapper) => wrapper.classList.remove("tt-stats-estimate-attacks-wrapper"));
	}
})();
