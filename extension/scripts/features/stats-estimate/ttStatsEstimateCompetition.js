"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.competition,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.competition"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		},
	);

	let triggerFilter;

	function registerListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.SWITCH_PAGE].push(() => {
			if (!feature.enabled() || settings.pages.userlist.filter) return;

			showEstimates();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(() => {
			if (!feature.enabled()) return;

			if (triggerFilter) clearTimeout(triggerFilter);
			triggerFilter = setTimeout(showEstimates, 500);
		});
	}

	async function startFeature() {
		if (settings.pages.competition.filter) {
			const list = document.find(".team-list-wrap");
			if (!list) return;
		}

		await showEstimates();
	}

	async function showEstimates() {
		await requireElement(".team-list-wrap");
		if (document.find("#nav-elimination")) document.body.classList.add("tt-elimination");

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".competition-list > li",
			(row) => ({
				id: row
					.find(".user.name[href]")
					.getAttribute("href")
					.match(/(?<=XID\=)\d+/)[0]
					.getNumber(),
				level: row.find(".level").textContent.getNumber(),
			}),
			true,
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
