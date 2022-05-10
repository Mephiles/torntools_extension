"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"War Estimates",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.wars,
		registerListeners,
		startFeature,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.wars"],
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

		if (window.location.hash.includes("/war/")) requireElement(".f-war-list > .descriptions").then(observeDescription);

		requireElement("ul.f-war-list").then(() => {
			observer = new MutationObserver((mutations) => {
				if (![...mutations].some((mutation) => [...(mutation.addedNodes ?? [])].some((node) => node.classList?.contains("descriptions")))) return;

				observeDescription();
			});
			observer.observe(document.find("ul.f-war-list"), { childList: true });
		});
	}

	function observeDescription() {
		showEstimates();

		requireElement(".faction-war .members-list").then(() => {
			new MutationObserver((mutations) => {
				let shouldEstimate = false;

				for (const mutation of mutations) {
					for (const node of mutation.removedNodes) {
						if (!node.classList?.contains("tt-estimated")) continue;

						node.classList.remove("tt-estimated");
						mutation.nextSibling?.remove();
					}

					for (const node of mutation.addedNodes) {
						if (!node.classList?.contains("your") && !node.classList?.contains("enemy")) continue;

						shouldEstimate = true;
						break;
					}
				}

				if (shouldEstimate) showEstimates();
			}).observe(document.find(".faction-war .members-list"), { childList: true });
		});
	}

	function showEstimates() {
		requireElement(".faction-war .members-list").then(() => {
			statsEstimate.clearQueue();
			statsEstimate.showEstimates(
				".faction-war .members-list > li.enemy, .faction-war .members-list > li.your",
				(row) => {
					return {
						id: parseInt(
							row
								.find(".user.name > [title]")
								.getAttribute("title")
								.match(/(\d+)/g)
								?.last()
						),
						level: parseInt(row.find(".level").textContent.trim()),
					};
				},
				false,
				undefined
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
