"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"Ranked War Estimates",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.rankedWars"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	let observer;

	function registerListeners() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(() => {
				if (!feature.enabled()) return;

				observeWars();
			});
		}
	}

	async function startFeature() {
		if (isOwnFaction && getHashParameters().has("tab")) return;

		observeWars();
	}

	function observeWars() {
		if (observer) observer.disconnect();

		if (location.hash.includes("/war/rank")) requireElement(".f-war-list > .descriptions").then(() => showEstimates());

		requireElement("ul.f-war-list").then(() => {
			observer = new MutationObserver((mutations) => {
				if (![...mutations].some((mutation) => [...(mutation.addedNodes ?? [])].some((node) => node.classList?.contains("descriptions")))) return;

				showEstimates();
			});
			observer.observe(document.find("ul.f-war-list"), { childList: true });
		});
	}

	function showEstimates() {
		requireElement(".faction-war .members-list").then(() => {
			statsEstimate.clearQueue();
			statsEstimate.showEstimates(
				".faction-war .members-list > li.enemy, .faction-war .members-list > li.your",
				(row) => {
					return {
						id: parseInt(row.find("[class*='honorWrap__'] > a").href.split("XID=")[1]),
						level: parseInt(row.find(".level").textContent.trim()),
					};
				},
				true,
				(row) => row.find(".clear")
			);
		});
	}

	function removeEstimates() {
		observer?.disconnect();
		observer = undefined;

		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
