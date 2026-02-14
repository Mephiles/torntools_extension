(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Available Players",
		"faction",
		() => settings.pages.faction.availablePlayers,
		initialiseListeners,
		startFeature,
		removeAvailable,
		{
			storage: ["settings.pages.faction.availablePlayers"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			showAvailable();
		});
	}

	function startFeature() {
		if (!document.querySelector(".faction-crimes-wrap")) return;

		showAvailable();
	}

	function showAvailable() {
		if (document.querySelector("div.plans-list.p10")) {
			displayAvailable(0).then(() => {});
		} else {
			const list = document.querySelector("ul.plans-list");
			if (!list) {
				displayAvailable(-1).then(() => {});
				return;
			}
			const members = findAllElements(".item", list).length;

			displayAvailable(members).then(() => {});
		}

		async function displayAvailable(amount: number) {
			if (document.querySelector("[class*='manualSpawnerContainer___']")) return;

			const crimes = document.querySelector("#faction-crimes");

			let message: string;
			if (amount === -1) {
				message = "You don't have OC permissions.";
			} else {
				message = `${amount} member${applyPlural(amount)} available for OCs.`;
			}

			crimes.insertBefore(createMessageBox(message, { class: "tt-available-players" }), crimes.firstElementChild);
		}
	}

	function removeAvailable() {
		for (const available of findAllElements(".tt-available-players")) available.remove();
	}
})();
