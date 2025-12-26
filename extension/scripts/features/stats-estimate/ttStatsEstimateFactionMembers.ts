(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate("Faction Members", true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.factions,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.factions"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		},
		null
	);

	function registerListeners() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (!feature.enabled() || settings.pages.faction.memberFilter) return;

				showEstimates();
			});
		}

		CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(({ filter }) => {
			if (!feature.enabled() || filter !== "Faction Member Filter") return;

			showEstimates();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(() => {
			if (!feature.enabled()) return;

			removeEstimates();
			showEstimates();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_SORT].push(() => {
			if (!feature.enabled()) return;

			removeEstimates();
			showEstimates();
		});
	}

	async function startFeature(forced: boolean) {
		if (isOwnFaction && getFactionSubpage() !== "info") return;
		if (settings.pages.faction.memberFilter && !forced) return;

		await showEstimates();
	}

	async function showEstimates() {
		await requireElement(".faction-info-wrap .table-body");

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".faction-info-wrap .table-body > .table-row",
			(row) => {
				// Don't show this for fallen players.
				if (row.find(".icons li[id*='icon77___']")) return null;

				return {
					id: getUsername(row).id,
					level: parseInt(row.find(".lvl").textContent.trim()),
				};
			},
			true,
			(row) =>
				row.nextElementSibling?.classList.contains("tt-last-action") || row.nextElementSibling?.classList.contains("tt-member-info")
					? (row.nextElementSibling as HTMLElement)
					: row
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
		document.findAll(".tt-estimated").forEach((row) => row.classList.remove("tt-estimated"));
	}
})();
