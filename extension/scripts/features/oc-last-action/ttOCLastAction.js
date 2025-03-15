"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"OC Last Action",
		"faction",
		() => settings.pages.faction.ocLastAction,
		initialiseListeners,
		startFeature,
		removeLastAction,
		{
			storage: ["settings.pages.faction.ocLastAction"],
		},
		async () => {
			if (!hasAPIData() || !factiondata || !factiondata.members) return "No API access.";
			else if (!!userdata.organizedCrime) return "No OC 1 data.";
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			showLastAction();
		});
	}

	function startFeature() {
		if (!document.find(".faction-crimes-wrap")) return;

		showLastAction();
	}

	function showLastAction() {
		const nowDate = Date.now();

		for (const row of document.findAll(".organize-wrap .crimes-list .details-list > li:not(:first-child) > ul")) {
			const id = new URL(row.find(".member a").href).searchParams.get("XID");

			const lastAction = factiondata.members[id].last_action;
			const hours = ((nowDate - lastAction.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals();

			row.insertAdjacentElement(
				"afterend",
				document.newElement({
					type: "div",
					class: "tt-oc-last-action",
					text: `Last action: ${lastAction.relative}`,
					attributes: { hours: hours },
				})
			);
		}
	}

	function removeLastAction() {
		for (const lastAction of document.findAll(".tt-oc-last-action")) lastAction.remove();
	}
})();
