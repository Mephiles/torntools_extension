"use strict";

(async () => {
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Warn Crime",
		"faction",
		() => settings.pages.faction.warnCrime,
		addListener,
		disableButtons,
		null,
		{
			storage: ["settings.pages.faction.warnCrime"],
		},
		null
	);

	const scenarioInformation = {};

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2].push(() => {
			if (!feature.enabled()) return;

			disableButtons();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2_REFRESH].push(() => {
			if (!feature.enabled()) return;

			disableButtons();
		});
		addFetchListener(({ detail: { page, json, fetch } }) => {
			if (page !== "page" || !json) return;

			const params = new URL(fetch.url).searchParams;
			const sid = params.get("sid");
			if (sid !== "organizedCrimesData") return;

			const step = params.get("step");
			if (step !== "crimeList") return;

			if (!json.success) return;

			const playerId = getUserDetails().id;
			const slots = json.data.flatMap((crime) =>
				crime.playerSlots
					.filter((slot) => slot.player === null || slot.player.ID !== playerId)
					.map((slot) => ({
						scenario: {
							name: crime.scenario.name,
							level: crime.scenario.level,
						},
						name: slot.name,
						successChance: slot.successChance,
						hasItem: slot.requirement?.doesExist ?? null,
					}))
			);

			slots.forEach(({ scenario: { name: scenarioName }, ...slot }) => {
				if (!(scenarioName in scenarioInformation)) scenarioInformation[scenarioName] = {};
				if (!(slot.name in scenarioInformation[scenarioName])) scenarioInformation[scenarioName][slot.name] = {};

				scenarioInformation[scenarioName][slot.name] = {
					hasItem: slot.hasItem,
					successChance: slot.successChance,
				};
			});
		});
	}

	async function disableButtons() {
		const list = await requireElement(".tt-oc2-list");
		list.querySelectorAll("[class*='joinButton___']:not(.tt-warn-crime--processed)").forEach((button) => {
			button.classList.add("tt-warn-crime--processed");

			const scenarioElement = button.closest("[class*='contentLayer___']");
			const slotElement = button.closest("[class*='wrapper___']");

			const scenarioName = scenarioElement.querySelector("[class*='panelTitle___']").textContent;
			const position = slotElement.querySelector("[class*='title___']").textContent;

			const blocked = [];

			const information = scenarioInformation[scenarioName][position];
			if (information.hasItem === false) blocked.push("item");

			if (blocked.length) {
				// button.disabled = true;
				button.setAttribute("title", `The following requirements aren't met: ${blocked.join(", ")}`);
			}
		});
	}
})();
