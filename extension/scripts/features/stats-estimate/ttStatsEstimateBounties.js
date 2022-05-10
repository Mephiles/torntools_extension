"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.bounties,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.bounties"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function registerListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.SWITCH_PAGE].push(() => {
			if (!feature.enabled() || settings.pages.bounties.filter) return;

			showEstimates();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(() => {
			if (!feature.enabled()) return;

			showEstimates();
		});
	}

	async function startFeature() {
		if (settings.pages.bounties.filter) {
			const list = document.find(".bounties-list");
			if (!list || !list.classList.contains("tt-filtered")) return;
		}

		await showEstimates();
	}

	async function showEstimates() {
		await requireElement(".bounties-list");

		const startParam = parseInt(getHashParameters().get("start")) || 0;
		const start = parseInt(getHashParameters(document.find(".claim a").href.split("#!")[1] ?? "").get("start")) || 0;
		if (start !== startParam) return;

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".bounties-list > li[data-id]",
			(row) => ({
				id: parseInt(
					row
						.find(".target a")
						.href.match(/(\d+)/g)
						?.last()
				),
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
