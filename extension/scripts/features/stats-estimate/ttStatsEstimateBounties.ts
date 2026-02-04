(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate("Bounties", true);
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

			return true;
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
			const list = document.querySelector(".bounties-list");
			if (!list || !list.classList.contains("tt-filtered")) return;
		}

		await showEstimates();
	}

	async function showEstimates() {
		await requireElement(".bounties-list");

		const startParam = parseInt(getHashParameters().get("start")) || 0;
		const start = parseInt(getHashParameters(document.querySelector<HTMLAnchorElement>(".claim a").href.split("#!")[1] ?? "").get("start")) || 0;
		if (start !== startParam) return;

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".bounties-list > li[data-id]",
			(row) => ({
				id: parseInt(row.querySelector<HTMLAnchorElement>(".target a").href.match(/(\d+)/g)?.at(-1)),
				level: parseInt(row.querySelector(".level").textContent.replaceAll("\n", "").split(":").at(-1)!.trim()),
			}),
			true
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
