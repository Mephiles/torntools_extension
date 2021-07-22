"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"War Finish Times",
		"faction",
		() => settings.pages.faction.warFinishTimes,
		startListeners,
		addFinishTimes,
		removeFunction,
		{
			storage: ["settings.pages.faction.warFinishTimes"],
		},
		null
	);

	function startListeners() {
		if (isOwnFaction()) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(() => {
				if (feature.enabled()) addFinishTimes();
			});
		}
	}

	async function addFinishTimes() {
		await requireElement("#react-root .f-war-list");

		document.findAll(".f-war-list.war-new .status-wrap .timer").forEach((warTimer) => {
			const millis = Date.now() + textToTime(warTimer.innerText);

			warTimer.insertAdjacentElement(
				"afterend",
				document.newElement({ type: "div", class: "tt-timer", text: `${formatTime(millis)} ${formatDate(millis)}` })
			);
		});
	}

	async function removeFunction() {
		document.findAll(".f-war-list.war-new .status-wrap .tt-timer").forEach((timer) => timer.remove());
	}
})();
