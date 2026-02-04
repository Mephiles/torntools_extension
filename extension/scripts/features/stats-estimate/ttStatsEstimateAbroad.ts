(async () => {
	if (!getPageStatus().access) return;
	if (!isAbroad()) return;

	const statsEstimate = new StatsEstimate("Abroad People", true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.abroad,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.abroad"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	let triggerFilter: number | undefined;

	function registerListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(() => {
			if (!feature.enabled()) return;

			if (triggerFilter) clearTimeout(triggerFilter);
			triggerFilter = setTimeout(showEstimates, 500);
		});
	}

	async function startFeature() {
		if (settings.pages.travel.peopleFilter) {
			const list = document.querySelector(".user-info-list-wrap");
			if (!list) return;
		}

		await showEstimates();
	}

	async function showEstimates() {
		await requireElement(".users-list");

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".users-list > li",
			(row) => ({
				id: parseInt(row.querySelector<HTMLAnchorElement>(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
				level: parseInt(row.querySelector(".level").textContent),
			}),
			true
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
