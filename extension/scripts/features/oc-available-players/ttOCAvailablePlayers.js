"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Available Players",
		"faction",
		() => settings.pages.faction.availablePlayers,
		initialiseListeners,
		null,
		null,
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

	function showAvailable() {
		if (document.find("div.plans-list.p10")) {
			displayAvailable(0).then(() => {});
		} else {
			const list = document.find("ul.plans-list");
			const members = list.findAll(".item").length;

			displayAvailable(members).then(() => {});
		}

		async function displayAvailable(amount) {
			const crimes = document.find("#faction-crimes");

			crimes.insertBefore(
				await createMessageBox(`${amount} member${applyPlural(amount)} available for OCs.`, { class: "tt-available-players" }),
				crimes.firstElementChild
			);
		}
	}
})();
