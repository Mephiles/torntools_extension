"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.userlist"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		},
	);

	let triggerFilter;

	function registerListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.USERLIST_SWITCH_PAGE].push(() => {
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
		if (settings.pages.userlist.filter) {
			const list = document.find(".user-info-list-wrap");
			if (!list || list.find(".ajax-placeholder, .ajax-preloader")) return;
		}

		await showEstimates();
	}

	async function showEstimates() {
		await requireElement(".user-info-list-wrap");
		await requireElement(".user-info-list-wrap .ajax-placeholder, .user-info-list-wrap .ajax-preloader", { invert: true });

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".user-info-list-wrap > li",
			(row) => ({
				id: parseInt(row.find(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
				level: parseInt(row.find(".level").textContent.replaceAll("\n", "").split(":").last().trim()),
			}),
			true,
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
