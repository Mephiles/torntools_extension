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
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			highlightCrime1();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2].push(() => {
			if (!feature.enabled()) return;

			highlightCrime2();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2_REFRESH].push(() => {
			if (!feature.enabled()) return;

			highlightCrime2();
		});
	}

	function startFeature() {
		if (!document.find(".faction-crimes-wrap")) return;

		if (userdata.organizedCrime) highlightCrime2();
		else highlightCrime1();
	}

	function highlightCrime1() {
		const member = document.find(`.crimes-list > li.item-wrap .team > a[href="/profiles.php?XID=${userdata.profile.id}"]`);
		if (!member) return;

		member.closest(".item-wrap").classList.add("tt-oc-highlight");
	}

	function highlightCrime2() {
		const member = document.querySelector(`[class*='slotMenuItem___'][href="/profiles.php?XID=${userdata.profile.id}"]`);
		if (!member) return;

		member.closest("[class*='contentLayer___']").classList.add("tt-oc-highlight");
	}

	function removeHighlight() {
		for (const highlight of document.findAll(".tt-oc-highlight")) highlight.classList.remove(".tt-oc-highlight");
	}
})();
