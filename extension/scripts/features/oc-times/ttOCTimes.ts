(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"OC Times",
		"faction",
		() => settings.pages.faction.ocTimes,
		initialiseListeners,
		startFeature,
		removeTimes,
		{
			storage: ["settings.pages.faction.ocTimes"],
		},
		async () => {
			if (!hasAPIData() || !factiondata || !("crimes" in factiondata) || !factiondata.crimes) return "No API access.";
			else if (!hasOC1Data()) return "No OC 1 data.";

			return true;
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			showTimes();
		});
	}

	function startFeature() {
		if (!document.querySelector(".faction-crimes-wrap")) return;

		showTimes();
	}

	function showTimes() {
		let oldDate: boolean | string = false;

		for (const crime of findAllElements(".organize-wrap .crimes-list > .item-wrap")) {
			const details = crime.querySelector<HTMLElement>(".details-wrap");
			if (!details) continue;

			const id = details.dataset.crime;

			let text: string;
			if ("crimes" in factiondata && id in factiondata.crimes) {
				const finish = new Date(factiondata.crimes[id].time_ready * 1000);

				const date = formatDate(finish);
				if (oldDate !== date) {
					crime.insertAdjacentElement("beforebegin", elementBuilder({ type: "div", class: "tt-oc-time-date", text: date }));
					oldDate = date;
				}

				text = `${formatTime(finish)} | ${date}`;
			} else {
				text = "N/A";
			}

			crime.querySelector(".status").appendChild(elementBuilder({ type: "span", class: "tt-oc-time", text }));
		}
	}

	function removeTimes() {
		for (const timer of findAllElements(".tt-oc-time")) timer.remove();
	}
})();
