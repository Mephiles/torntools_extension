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

	function registerListeners() {
		addXHRListener(async ({ detail: { page, xhr } }) => {
			if (!feature.enabled()) return;
			if (page !== "userlist") return;

			const step = new URLSearchParams(xhr.requestBody).get("step");
			if (step !== "blackList") return;

			new MutationObserver((mutations, observer) => {
				showEstimates();
				observer.disconnect();
			}).observe(document.find(".blacklist"), { childList: true });
		});
	}

	async function showEstimates() {
		await requireElement(".user-info-blacklist-wrap");

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".user-info-blacklist-wrap > li[data-id]",
			(row) => ({
				id: parseInt(row.find(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
				level: parseInt(row.find(".level").textContent.replaceAll("\n", "").split(":").last().trim()),
			}),
			true
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
