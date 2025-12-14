"use strict";

// Reformat profile page headings as "USERNAME [ID]".

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Faction ID",
		"faction",
		() => settings.pages.faction.idBesideFactionName,
		initialise,
		addID,
		removeID,
		{
			storage: ["settings.pages.faction.idBesideFactionName"],
		},
		null
	);

	function initialise() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (!feature.enabled() || !settings.pages.faction.idBesideFactionName) return;

				addID();
			});
		}
	}

	async function addID() {
		if (document.getElementById("tt-faction-id")) return; // Element has already been added - second check in-case feature reinjects

		const container = await requireElement(".faction-info-wrap > .title-black");

		const details = await readFactionDetails();
		if (!details) throw new Error("Faction ID could not be found.");

		container.appendChild(document.newElement({ type: "span", text: ` [${details.id}]`, id: "tt-faction-id" }));
	}

	function removeID() {
		document.findAll("#tt-faction-id").forEach((element) => element.remove());
	}
})();
