"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Highlight OC",
		"faction",
		() => settings.pages.faction.highlightOwn,
		initialiseListeners,
		startFeature,
		removeHighlight,
		{
			storage: ["settings.pages.faction.highlightOwn"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		},
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			highlightCrime();
		});
	}

	function startFeature() {
		if (!document.find(".faction-crimes-wrap")) return;

		highlightCrime();
	}

	function highlightCrime() {
		const member = document.find(`.crimes-list > li.item-wrap .team > a[href="/profiles.php?XID=${userdata.player_id}"]`);
		if (!member) return;

		member.closest(".item-wrap").classList.add("tt-oc-highlight");
	}

	function removeHighlight() {
		for (const highlight of document.findAll(".tt-oc-highlight")) highlight.classList.remove(".tt-oc-highlight");
	}
})();
