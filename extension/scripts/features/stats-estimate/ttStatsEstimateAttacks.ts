(async () => {
	if (!getPageStatus().access) return;
	if (isOwnProfile()) return;

	const statsEstimate = new StatsEstimate("Attacks", false);
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
			return true;
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
					profile: {
						rank,
						level,
						last_action: { timestamp: lastAction },
						id,
					},
					criminalrecord: { total: crimes },
					personalstats: {
						networth: { total: networth },
					},
				} = userdata;

				const estimate = statsEstimate.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);

				createElement(estimate, true, "attacker");
			}
		}

		function createElement(stats: number, isEstimate: false, side: "attacker" | "defender"): void;
		function createElement(estimate: string, isEstimate: true, side: "attacker" | "defender"): void;
		function createElement(estimate: string | number, isEstimate: boolean, side: "attacker" | "defender") {
			let text: string;
			if (isEstimate && typeof estimate === "string") {
				text = mobile ? `Estimate: ${estimate.replace("under ", "<").replace("over ", ">")}` : `Stats Estimate: ${estimate}`;
			} else if (!isNaN(parseInt(estimate.toString()))) {
				text = mobile ? `Stats: ${formatNumber(estimate, { shorten: 3, decimals: 1 })}` : `Battle Stats: ${formatNumber(estimate, { shorten: true })}`;
			} else throw "Not a correct estimate!";

			let entries: HTMLElement;
			if (mobile || tablet) {
				const sideColor = side === "attacker" ? "green___" : "rose___";
				entries = document.querySelector(
					`div[class*='playersModelWrap___'] div[class*='headerWrapper___'][class*=${sideColor}] div[class*='textEntries___']`
				);
			} else {
				if (side === "attacker")
					entries = document.querySelector("div[class*='playersModelWrap___'] div[class*='player___']:first-child div[class*='textEntries___']");
				else if (side === "defender")
					entries = document.querySelector("div[class*='playersModelWrap___'] div[class*='player___']:nth-child(2) div[class*='textEntries___']");
			}

			entries.classList.add("tt-stats-estimate-attacks-wrapper");
			entries.insertAdjacentElement("afterbegin", elementBuilder({ type: "div", class: "tt-stats-estimate-attacks", text }));
		}
	}

	function removeEstimate() {
		findAllElements(".tt-stats-estimate-attacks").forEach((estimate) => estimate.remove());
		findAllElements(".tt-stats-estimate-attacks-wrapper").forEach((wrapper) => wrapper.classList.remove("tt-stats-estimate-attacks-wrapper"));
	}
})();
