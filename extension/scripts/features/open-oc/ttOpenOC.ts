(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Open OC",
		"faction",
		() => settings.pages.faction.openOc,
		initialiseListeners,
		startFeature,
		null,
		{
			storage: ["settings.pages.faction.openOc"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			openCrimes();
		});
	}

	function startFeature() {
		if (!document.find(".faction-crimes-wrap")) return;

		openCrimes();
	}

	async function openCrimes() {
		for (const crime of document.findAll(".organize-wrap .crimes-list > li")) {
			const status = crime.find(".status .bold");
			if (!status || status.textContent.trim() !== "Ready") continue;

			const allReady = [...crime.findAll(".details-list > li:not(:first-child) .stat")].every((row) => row.textContent === "Okay");
			if (allReady) crime.classList.add("active");
		}
	}
})();
