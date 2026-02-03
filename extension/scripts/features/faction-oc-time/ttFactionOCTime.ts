(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Faction OC Timer",
		"sidebar",
		() => settings.pages.sidebar.factionOCTimer,
		null,
		showTimer,
		removeTimer,
		{
			storage: ["settings.pages.sidebar.factionOCTimer", "factiondata.crimes"],
		},
		() => {
			if (!hasAPIData() || !("crimes" in factiondata) || !factiondata.crimes) return "No API access.";
			else if (!hasOC1Data()) return "No OC 1 data.";

			return true;
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		await addInformationSection();
		showInformationSection();

		// Next available OC timer
		if (factiondata && "crimes" in factiondata) {
			const factionOCElement = elementBuilder({ type: "span", class: "countdown" });
			const ocArray = Object.values(factiondata.crimes)
				.filter((oc) => !oc.time_completed)
				.sort((a, b) => a.time_left - b.time_left);

			if (ocArray.length) {
				const nextOC = ocArray[0];

				const nextOCTimeLeft = nextOC.time_ready * 1000 - Date.now();

				if (nextOCTimeLeft <= TO_MILLIS.HOURS * 8) factionOCElement.classList.add("short");
				else if (nextOCTimeLeft <= TO_MILLIS.HOURS * 12) factionOCElement.classList.add("medium");

				if (nextOCTimeLeft > 0) {
					const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
					factionOCElement.textContent = formatTime({ milliseconds: nextOCTimeLeft }, formatOptions);

					factionOCElement.dataset.end = (nextOC.time_ready * 1000).toString();
					factionOCElement.dataset.timeSettings = JSON.stringify(formatOptions);
					countdownTimers.push(factionOCElement);
				} else {
					factionOCElement.textContent = "OC Ready";
				}
			} else {
				factionOCElement.textContent = "No OCs planned.";
			}

			document.find(".tt-sidebar-information").appendChild(
				elementBuilder({
					type: "section",
					id: "factionOCTimer",
					children: [elementBuilder({ type: "a", class: "title", text: "Faction OC: ", href: LINKS.organizedCrimes }), factionOCElement],
					style: { order: "2" },
				})
			);
		}
	}

	function removeTimer() {
		// Timer for the next available *faction* OC
		const secondTimer = document.find("#factionOCTimer");
		if (secondTimer) secondTimer.remove();
	}

	return true;
})();
