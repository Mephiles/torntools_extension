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
		if (!document.querySelector(".faction-crimes-wrap")) return;

		openCrimes();
	}

	async function openCrimes() {
		for (const crime of findAllElements(".organize-wrap .crimes-list > li")) {
			const status = crime.querySelector(".status .bold");
			if (!status || status.textContent.trim() !== "Ready") continue;

			const allReady = findAllElements(".details-list > li:not(:first-child) .stat", crime).every((row) => row.textContent === "Okay");
			if (allReady) crime.classList.add("active");
		}
	}
})();
