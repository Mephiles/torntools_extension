"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.enemies,
		registerListeners,
		showEstimates,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.enemies"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	async function registerListeners() {
		const observer = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => node.tagName === "UL"))) {
				if (feature.enabled())
					showEstimates();
			}
		});
		observer.observe(await requireElement(".tableWrapper"), { childList: true });
	}

	async function showEstimates() {
		await requireElement(".tableWrapper ul > li");

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".tableWrapper ul > li",
			(row) => ({
				id: parseInt(row.find("[class*='userInfoBox__'] a[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
				level: row.find("[class*='level__']").textContent.getNumber(),
			}),
			true
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
