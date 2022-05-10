"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Gym Steadfast",
		"gym",
		() => settings.pages.gym.steadfast,
		initialiseListeners,
		showSteadfast,
		removeSteadfast,
		{
			storage: ["settings.pages.gym.steadfast"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.perks) return "No API access.";
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.GYM_LOAD].push(() => {
			if (!feature.enabled()) return;

			showSteadfast();
		});
	}

	async function showSteadfast() {
		const properties = await requireElement("#gymroot ul[class*='properties___']");

		const perks = userdata.faction_perks.filter((perk) => perk.includes("gym gains"));

		for (const stat of ["strength", "defense", "speed", "dexterity"]) {
			const perk = perks.find((perk) => perk.includes(stat));
			if (!perk) continue;

			const [, amount] = perk.match(/(\d+)%/);
			const box = properties.find(`[class*='${stat}___']`);

			if (box.find(".tt-gym-steadfast")) continue;

			box.insertBefore(document.newElement({ type: "div", class: "tt-gym-steadfast", text: `Steadfast: ${amount}%` }), box.firstElementChild);
		}
	}

	function removeSteadfast() {
		for (const steadfast of document.findAll(".tt-gym-steadfast")) steadfast.remove();
	}
})();
