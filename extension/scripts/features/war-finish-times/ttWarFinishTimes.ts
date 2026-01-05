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
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(() => {
				if (feature.enabled()) addFinishTimes();
			});
		}
	}

	async function addFinishTimes() {
		await requireElement("#react-root .f-war-list");

		for (const timer of document.findAll(".status-wrap .timer:not(.tt-modified)")) {
			const millis = Date.now() + textToTime(timer.textContent);

			timer.insertAdjacentElement(
				"afterend",
				document.newElement({ type: "div", class: "tt-timer", text: `${formatTime(millis)} ${formatDate(millis)}` })
			);
			timer.classList.add("tt-modified");
		}
	}

	async function removeFunction() {
		document.findAll(".f-war-list.war-new .status-wrap .tt-timer").forEach((timer) => timer.remove());
	}
})();
